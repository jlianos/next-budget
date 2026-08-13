"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import * as v from "valibot";
import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";
import { DatabaseIdSchema } from "@/lib/validation";
import { createWalletSchema, type DeleteWalletFormState, type WalletFormState } from "./validation";

async function getWalletActionContext() {
  const t = await getTranslations("Wallets.feedback");
  const schema = createWalletSchema({
    nameRequired: t("validation.nameRequired"),
    nameTooShort: t("validation.nameTooShort"),
    nameTooLong: t("validation.nameTooLong"),
  });

  return { schema, t };
}

export async function createWallet(
  workspaceId: string,
  _previousState: WalletFormState,
  formData: FormData,
): Promise<WalletFormState> {
  const [user, { schema: CreateWalletSchema, t }] = await Promise.all([requireUser(), getWalletActionContext()]);

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
      formError: t("noAccess"),
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: t("cannotCreate"),
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
          name: [t("duplicate")],
        },
      };
    }

    console.error("Unable to create wallet:", error);

    return {
      formError: t("createFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/wallets`);
  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {
    successMessage: t("created"),
  };
}

export async function updateWallet(
  workspaceId: string,
  walletId: string,
  _previousState: WalletFormState,
  formData: FormData,
): Promise<WalletFormState> {
  const [user, { schema: CreateWalletSchema, t }] = await Promise.all([requireUser(), getWalletActionContext()]);

  const walletIdResult = v.safeParse(DatabaseIdSchema, walletId);

  if (!walletIdResult.success) {
    return {
      formError: t("invalidWallet"),
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
      formError: t("noAccess"),
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: t("cannotRename"),
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
        formError: t("unavailable"),
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        fieldErrors: {
          name: [t("duplicate")],
        },
      };
    }

    console.error("Unable to rename wallet:", error);

    return {
      formError: t("renameFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/wallets`);
  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {
    successMessage: t("renamed"),
  };
}

export async function deleteWallet(
  workspaceId: string,
  walletId: string,
  _previousState: DeleteWalletFormState,
  _formData: FormData,
): Promise<DeleteWalletFormState> {
  const [user, t] = await Promise.all([requireUser(), getTranslations("Wallets.feedback")]);

  const walletIdResult = v.safeParse(DatabaseIdSchema, walletId);

  if (!walletIdResult.success) {
    return {
      formError: t("invalidWallet"),
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
        formError: t("noAccess"),
      };
    }

    if (outcome === "VIEWER") {
      return {
        formError: t("cannotDelete"),
      };
    }

    if (outcome === "NOT_FOUND") {
      return {
        formError: t("unavailable"),
      };
    }

    if (outcome === "IN_USE") {
      return {
        formError: t("inUse"),
      };
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        formError: t("inUse"),
      };
    }

    console.error("Unable to delete wallet:", error);

    return {
      formError: t("deleteFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/settings/wallets`);
  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {};
}
