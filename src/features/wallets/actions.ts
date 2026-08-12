"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";
import { DatabaseIdSchema } from "@/lib/validation";
import { CreateWalletSchema, type DeleteWalletFormState, type WalletFormState } from "./validation";

export async function createWallet(
  workspaceId: string,
  _previousState: WalletFormState,
  formData: FormData,
): Promise<WalletFormState> {
  const user = await requireUser();

  const result = v.safeParse(CreateWalletSchema, {
    name: formData.get("name"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CreateWalletSchema>(result.issues).nested,
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
      formError: "Your workspace role cannot create wallets.",
    };
  }

  try {
    await prisma.wallet.create({
      data: {
        name: result.output.name,
        workspaceId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        fieldErrors: {
          name: ["A wallet with this name already exists."],
        },
      };
    }

    console.error("Unable to create wallet:", error);

    return {
      formError: "Unable to create this wallet. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/wallets`);
  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {
    successMessage: "Wallet created successfully.",
  };
}

export async function updateWallet(
  workspaceId: string,
  walletId: string,
  _previousState: WalletFormState,
  formData: FormData,
): Promise<WalletFormState> {
  const user = await requireUser();

  const walletIdResult = v.safeParse(DatabaseIdSchema, walletId);

  if (!walletIdResult.success) {
    return {
      formError: "This wallet is invalid.",
    };
  }

  const result = v.safeParse(CreateWalletSchema, {
    name: formData.get("name"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CreateWalletSchema>(result.issues).nested,
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
      formError: "Your workspace role cannot rename wallets.",
    };
  }

  try {
    const updateResult = await prisma.wallet.updateMany({
      where: {
        id: walletIdResult.output,
        workspaceId,
      },
      data: {
        name: result.output.name,
      },
    });

    if (updateResult.count === 0) {
      return {
        formError: "This wallet is no longer available.",
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        fieldErrors: {
          name: ["A wallet with this name already exists."],
        },
      };
    }

    console.error("Unable to rename wallet:", error);

    return {
      formError: "Unable to rename this wallet. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/wallets`);
  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {
    successMessage: "Wallet renamed successfully.",
  };
}

export async function deleteWallet(
  workspaceId: string,
  walletId: string,
  _previousState: DeleteWalletFormState,
  _formData: FormData,
): Promise<DeleteWalletFormState> {
  const user = await requireUser();

  const walletIdResult = v.safeParse(DatabaseIdSchema, walletId);

  if (!walletIdResult.success) {
    return {
      formError: "This wallet is invalid.",
    };
  }

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

      const wallet = await tx.wallet.findFirst({
        where: {
          id: walletIdResult.output,
          workspaceId,
        },
        select: {
          id: true,
          _count: {
            select: {
              transactions: true,
              incomingTransfers: true,
              outgoingTransfers: true,
              recurringTransactions: true,
            },
          },
        },
      });

      if (!wallet) {
        return "NOT_FOUND";
      }

      const referenceCount =
        wallet._count.transactions +
        wallet._count.incomingTransfers +
        wallet._count.outgoingTransfers +
        wallet._count.recurringTransactions;

      if (referenceCount > 0) {
        return "IN_USE";
      }

      await tx.wallet.delete({
        where: {
          id: wallet.id,
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
        formError: "Your workspace role cannot delete wallets.",
      };
    }

    if (outcome === "NOT_FOUND") {
      return {
        formError: "This wallet is no longer available.",
      };
    }

    if (outcome === "IN_USE") {
      return {
        formError: "This wallet cannot be deleted while financial activity references it.",
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        formError: "This wallet cannot be deleted while financial activity references it.",
      };
    }

    console.error("Unable to delete wallet:", error);

    return {
      formError: "Unable to delete this wallet. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/wallets`);
  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {};
}
