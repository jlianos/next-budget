"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import * as v from "valibot";
import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";
import { parseDateTime } from "@/lib/dates";
import { DatabaseIdSchema } from "@/lib/validation";

import { createTransferSchema, type DeleteTransferState, type TransferFormState } from "./validation";

async function getTransferActionContext() {
  const t = await getTranslations("Transfers.feedback");
  const schema = createTransferSchema({
    selectOption: t("validation.selectOption"), invalidOption: t("validation.invalidOption"),
    amountRequired: t("validation.amountRequired"), amountInvalid: t("validation.amountInvalid"),
    amountPrecision: t("validation.amountPrecision"), amountPositive: t("validation.amountPositive"),
    dateRequired: t("validation.dateRequired"), dateInvalid: t("validation.dateInvalid"),
    differentWallets: t("validation.differentWallets"),
  });
  return { schema, t };
}

export async function createTransfer(
  workspaceId: string,
  _previousState: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  const [user, { schema: CreateTransferSchema, t }] = await Promise.all([requireUser(), getTransferActionContext()]);

  const result = v.safeParse(CreateTransferSchema, {
    amount: formData.get("amount"),
    fromWalletId: formData.get("fromWalletId"),
    toWalletId: formData.get("toWalletId"),
    occurredAt: formData.get("occurredAt"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CreateTransferSchema>(result.issues).nested,
    };
  }

  const { amount, fromWalletId, toWalletId, occurredAt } = result.output;

  const [membership, wallets] = await Promise.all([
    prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
      select: {
        role: true,
      },
    }),

    prisma.wallet.findMany({
      where: {
        workspaceId,
        id: {
          in: [fromWalletId, toWalletId],
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

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

  const availableWalletIds = new Set(wallets.map((wallet) => wallet.id));

  if (!availableWalletIds.has(fromWalletId)) {
    return {
      fieldErrors: {
        fromWalletId: [t("sourceUnavailable")],
      },
    };
  }

  if (!availableWalletIds.has(toWalletId)) {
    return {
      fieldErrors: {
        toWalletId: [t("destinationUnavailable")],
      },
    };
  }

  try {
    await prisma.transfer.create({
      data: {
        amount: new Prisma.Decimal(amount),
        fromWalletId,
        toWalletId,
        createdById: user.id,
        occurredAt: parseDateTime(occurredAt),
      },
    });
  } catch (error) {
    console.error("Unable to create transfer:", error);

    return {
      formError: t("saveFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {
    successMessage: t("recorded"),
  };
}

export async function updateTransfer(
  workspaceId: string,
  transferId: string,
  _previousState: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  const [user, { schema: CreateTransferSchema, t }] = await Promise.all([requireUser(), getTransferActionContext()]);

  const transferIdResult = v.safeParse(DatabaseIdSchema, transferId);

  if (!transferIdResult.success) {
    return {
      formError: t("transferInvalid"),
    };
  }

  const result = v.safeParse(CreateTransferSchema, {
    amount: formData.get("amount"),
    fromWalletId: formData.get("fromWalletId"),
    toWalletId: formData.get("toWalletId"),
    occurredAt: formData.get("occurredAt"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CreateTransferSchema>(result.issues).nested,
    };
  }

  const parsedTransferId = transferIdResult.output;
  const { amount, fromWalletId, toWalletId, occurredAt } = result.output;

  const [membership, transfer, wallets] = await Promise.all([
    prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
      select: {
        role: true,
      },
    }),

    prisma.transfer.findFirst({
      where: {
        id: parsedTransferId,
        fromWallet: {
          workspaceId,
        },
        toWallet: {
          workspaceId,
        },
      },
      select: {
        id: true,
      },
    }),

    prisma.wallet.findMany({
      where: {
        workspaceId,
        id: {
          in: [fromWalletId, toWalletId],
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!membership) {
    return {
      formError: t("noAccess"),
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: t("cannotEdit"),
    };
  }

  if (!transfer) {
    return {
      formError: t("transferUnavailable"),
    };
  }

  const availableWalletIds = new Set(wallets.map((wallet) => wallet.id));

  if (!availableWalletIds.has(fromWalletId)) {
    return {
      fieldErrors: {
        fromWalletId: [t("sourceUnavailable")],
      },
    };
  }

  if (!availableWalletIds.has(toWalletId)) {
    return {
      fieldErrors: {
        toWalletId: [t("destinationUnavailable")],
      },
    };
  }

  try {
    await prisma.transfer.update({
      where: {
        id: transfer.id,
      },
      data: {
        amount: new Prisma.Decimal(amount),
        fromWalletId,
        toWalletId,
        occurredAt: parseDateTime(occurredAt),
      },
    });
  } catch (error) {
    console.error("Unable to update transfer:", error);

    return {
      formError: t("updateFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);
  redirect(`/w/${workspaceId}/activity`);
}

export async function deleteTransfer(
  workspaceId: string,
  transferId: string,
  _previousState: DeleteTransferState,
  _formData: FormData,
): Promise<DeleteTransferState> {
  const [user, t] = await Promise.all([requireUser(), getTranslations("Transfers.feedback")]);

  const transferIdResult = v.safeParse(DatabaseIdSchema, transferId);

  if (!transferIdResult.success) {
    return {
      formError: t("transferInvalid"),
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
      formError: t("cannotDelete"),
    };
  }

  try {
    const result = await prisma.transfer.deleteMany({
      where: {
        id: transferIdResult.output,
        fromWallet: {
          workspaceId,
        },
        toWallet: {
          workspaceId,
        },
      },
    });

    if (result.count !== 1) {
      return {
        formError: t("transferUnavailable"),
      };
    }
  } catch (error) {
    console.error("Unable to delete transfer:", error);

    return {
      formError: t("deleteFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  redirect(`/w/${workspaceId}/activity`);
}
