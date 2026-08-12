"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";
import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";
import { parseDateTime } from "@/lib/dates";
import { DatabaseIdSchema } from "@/lib/validation";

import { CreateTransferSchema, type DeleteTransferState, type TransferFormState } from "./validation";

export async function createTransfer(
  workspaceId: string,
  _previousState: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  const user = await requireUser();

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
      formError: "You do not have access to this workspace.",
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: "Your workspace role cannot create transfers.",
    };
  }

  const availableWalletIds = new Set(wallets.map((wallet) => wallet.id));

  if (!availableWalletIds.has(fromWalletId)) {
    return {
      fieldErrors: {
        fromWalletId: ["The source wallet is unavailable."],
      },
    };
  }

  if (!availableWalletIds.has(toWalletId)) {
    return {
      fieldErrors: {
        toWalletId: ["The destination wallet is unavailable."],
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
      formError: "Unable to save this transfer. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {
    successMessage: "Transfer recorded successfully.",
  };
}

export async function updateTransfer(
  workspaceId: string,
  transferId: string,
  _previousState: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  const user = await requireUser();

  const transferIdResult = v.safeParse(DatabaseIdSchema, transferId);

  if (!transferIdResult.success) {
    return {
      formError: "The transfer is invalid.",
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
      formError: "You do not have access to this workspace.",
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: "Your workspace role cannot edit transfers.",
    };
  }

  if (!transfer) {
    return {
      formError: "This transfer is unavailable.",
    };
  }

  const availableWalletIds = new Set(wallets.map((wallet) => wallet.id));

  if (!availableWalletIds.has(fromWalletId)) {
    return {
      fieldErrors: {
        fromWalletId: ["The source wallet is unavailable."],
      },
    };
  }

  if (!availableWalletIds.has(toWalletId)) {
    return {
      fieldErrors: {
        toWalletId: ["The destination wallet is unavailable."],
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
      formError: "Unable to update this transfer. Please try again.",
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
  const user = await requireUser();

  const transferIdResult = v.safeParse(DatabaseIdSchema, transferId);

  if (!transferIdResult.success) {
    return {
      formError: "The transfer is invalid.",
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
      formError: "Your workspace role cannot delete transfers.",
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
        formError: "This transfer is unavailable.",
      };
    }
  } catch (error) {
    console.error("Unable to delete transfer:", error);

    return {
      formError: "Unable to delete this transfer. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  redirect(`/w/${workspaceId}/activity`);
}
