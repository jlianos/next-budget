"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";

import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { deleteSelectedWorkspaceId, getSelectedWorkspaceId } from "@/features/workspaces/preference";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";

import { type DeleteWorkspaceState, RenameWorkspaceSchema, type RenameWorkspaceState } from "./validation";

export async function renameWorkspace(
  workspaceId: string,
  _previousState: RenameWorkspaceState,
  formData: FormData,
): Promise<RenameWorkspaceState> {
  const user = await requireUser();

  const result = v.safeParse(RenameWorkspaceSchema, {
    name: formData.get("name"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof RenameWorkspaceSchema>(result.issues).nested,
    };
  }

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return {
      formError: "You do not have access to this workspace.",
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: "Your workspace role cannot rename this workspace.",
    };
  }

  try {
    const updateResult = await prisma.workspace.updateMany({
      where: {
        id: workspaceId,
        users: {
          some: {
            userId: user.id,
          },
        },
      },
      data: {
        name: result.output.name,
      },
    });

    if (updateResult.count !== 1) {
      return {
        formError: "This workspace is no longer available.",
      };
    }
  } catch (error) {
    console.error("Unable to rename workspace:", error);

    return {
      formError: "Unable to rename this workspace. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}`, "layout");
  revalidatePath(`/w/${workspaceId}/settings`);
  revalidatePath("/workspaces");

  return {
    successMessage: "Workspace renamed successfully.",
  };
}

export async function deleteWorkspace(
  workspaceId: string,
  _previousState: DeleteWorkspaceState,
  _formData: FormData,
): Promise<DeleteWorkspaceState> {
  const user = await requireUser();

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const membership = await tx.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId,
          },
        },
        select: {
          role: true,
        },
      });

      if (!membership) {
        return "NO_ACCESS";
      }

      if (membership.role === WorkspaceRole.VIEWER) {
        return "VIEWER";
      }

      const workspace = await tx.workspace.findUnique({
        where: {
          id: workspaceId,
        },
        select: {
          id: true,
        },
      });

      if (!workspace) {
        return "NOT_FOUND";
      }

      const transactionCount = await tx.transaction.count({
        where: {
          OR: [
            {
              wallet: {
                workspaceId,
              },
            },
            {
              category: {
                transactionType: {
                  workspaceId,
                },
              },
            },
          ],
        },
      });

      const transferCount = await tx.transfer.count({
        where: {
          OR: [
            {
              fromWallet: {
                workspaceId,
              },
            },
            {
              toWallet: {
                workspaceId,
              },
            },
          ],
        },
      });

      const recurringCount = await tx.recurringTransaction.count({
        where: {
          OR: [
            {
              wallet: {
                workspaceId,
              },
            },
            {
              category: {
                transactionType: {
                  workspaceId,
                },
              },
            },
          ],
        },
      });

      if (transactionCount > 0 || transferCount > 0 || recurringCount > 0) {
        return "IN_USE";
      }

      await tx.transactionCategory.deleteMany({
        where: {
          transactionType: {
            workspaceId,
          },
        },
      });

      await tx.transactionType.deleteMany({
        where: {
          workspaceId,
        },
      });

      await tx.wallet.deleteMany({
        where: {
          workspaceId,
        },
      });

      await tx.userWorkspace.deleteMany({
        where: {
          workspaceId,
        },
      });

      await tx.workspace.delete({
        where: {
          id: workspace.id,
        },
      });

      return "DELETED";
    });

    if (outcome === "NO_ACCESS") {
      return {
        formError: "You do not have access to this workspace.",
      };
    }

    if (outcome === "VIEWER") {
      return {
        formError: "Your workspace role cannot delete this workspace.",
      };
    }

    if (outcome === "NOT_FOUND") {
      return {
        formError: "This workspace is no longer available.",
      };
    }

    if (outcome === "IN_USE") {
      return {
        formError: "Delete all transactions, transfers, and recurring schedules first.",
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        formError: "This workspace still has records that prevent deletion.",
      };
    }

    console.error("Unable to delete workspace:", error);

    return {
      formError: "Unable to delete this workspace. Please try again.",
    };
  }

  const selectedWorkspaceId = await getSelectedWorkspaceId(user.id);

  if (selectedWorkspaceId === workspaceId) {
    await deleteSelectedWorkspaceId(user.id);
  }

  revalidatePath("/workspaces");
  redirect("/workspaces");
}
