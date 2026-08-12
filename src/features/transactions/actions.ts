"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";

import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";
import { parseDateTime } from "@/lib/dates";
import { DatabaseIdSchema } from "@/lib/validation";

import { CreateTransactionSchema, type DeleteTransactionState, type TransactionFormState } from "./validation";

export async function createTransaction(
  workspaceId: string,
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const user = await requireUser();

  const result = v.safeParse(CreateTransactionSchema, {
    amount: formData.get("amount"),
    walletId: formData.get("walletId"),
    categoryId: formData.get("categoryId"),
    occurredAt: formData.get("occurredAt"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CreateTransactionSchema>(result.issues).nested,
    };
  }

  const { amount, walletId, categoryId, occurredAt } = result.output;

  const [membership, wallet, category] = await Promise.all([
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

    prisma.wallet.findFirst({
      where: {
        id: walletId,
        workspaceId,
      },
      select: {
        id: true,
      },
    }),

    prisma.transactionCategory.findFirst({
      where: {
        id: categoryId,
        transactionType: {
          workspaceId,
        },
      },
      select: {
        id: true,
        transactionType: {
          select: {
            direction: true,
          },
        },
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
      formError: "Your workspace role cannot create transactions.",
    };
  }

  if (!wallet) {
    return {
      fieldErrors: {
        walletId: ["The selected wallet is unavailable."],
      },
    };
  }

  if (!category) {
    return {
      fieldErrors: {
        categoryId: ["The selected category is unavailable."],
      },
    };
  }

  try {
    await prisma.transaction.create({
      data: {
        amount: new Prisma.Decimal(amount),
        walletId: wallet.id,
        categoryId: category.id,
        createdById: user.id,
        occurredAt: parseDateTime(occurredAt),
      },
    });
  } catch (error) {
    console.error("Unable to create transaction:", error);

    return {
      formError: "Unable to save this transaction. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  const transactionLabel = category.transactionType.direction === "INCOME" ? "Income" : "Expense";

  return {
    successMessage: `${transactionLabel} recorded successfully.`,
  };
}

export async function updateTransaction(
  workspaceId: string,
  transactionId: string,
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const user = await requireUser();

  const transactionIdResult = v.safeParse(DatabaseIdSchema, transactionId);

  if (!transactionIdResult.success) {
    return {
      formError: "The transaction is invalid.",
    };
  }

  const result = v.safeParse(CreateTransactionSchema, {
    amount: formData.get("amount"),
    walletId: formData.get("walletId"),
    categoryId: formData.get("categoryId"),
    occurredAt: formData.get("occurredAt"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CreateTransactionSchema>(result.issues).nested,
    };
  }

  const parsedTransactionId = transactionIdResult.output;
  const { amount, walletId, categoryId, occurredAt } = result.output;

  const [membership, transaction, wallet, category] = await Promise.all([
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

    prisma.transaction.findFirst({
      where: {
        id: parsedTransactionId,
        wallet: {
          workspaceId,
        },
        category: {
          transactionType: {
            workspaceId,
          },
        },
      },
      select: {
        id: true,
      },
    }),

    prisma.wallet.findFirst({
      where: {
        id: walletId,
        workspaceId,
      },
      select: {
        id: true,
      },
    }),

    prisma.transactionCategory.findFirst({
      where: {
        id: categoryId,
        transactionType: {
          workspaceId,
        },
      },
      select: {
        id: true,
        transactionType: {
          select: {
            direction: true,
          },
        },
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
      formError: "Your workspace role cannot edit transactions.",
    };
  }

  if (!transaction) {
    return {
      formError: "This transaction is unavailable.",
    };
  }

  if (!wallet) {
    return {
      fieldErrors: {
        walletId: ["The selected wallet is unavailable."],
      },
    };
  }

  if (!category) {
    return {
      fieldErrors: {
        categoryId: ["The selected category is unavailable."],
      },
    };
  }

  try {
    await prisma.transaction.update({
      where: {
        id: transaction.id,
      },
      data: {
        amount: new Prisma.Decimal(amount),
        walletId: wallet.id,
        categoryId: category.id,
        occurredAt: parseDateTime(occurredAt),
      },
    });
  } catch (error) {
    console.error("Unable to update transaction:", error);

    return {
      formError: "Unable to update this transaction. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);
  redirect(`/w/${workspaceId}/activity`);
}

export async function deleteTransaction(
  workspaceId: string,
  transactionId: string,
  _previousState: DeleteTransactionState,
  _formData: FormData,
): Promise<DeleteTransactionState> {
  const user = await requireUser();

  const transactionIdResult = v.safeParse(DatabaseIdSchema, transactionId);

  if (!transactionIdResult.success) {
    return {
      formError: "The transaction is invalid.",
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
      formError: "Your workspace role cannot delete transactions.",
    };
  }

  try {
    const result = await prisma.transaction.deleteMany({
      where: {
        id: transactionIdResult.output,
        wallet: {
          workspaceId,
        },
        category: {
          transactionType: {
            workspaceId,
          },
        },
      },
    });

    if (result.count !== 1) {
      return {
        formError: "This transaction is unavailable.",
      };
    }
  } catch (error) {
    console.error("Unable to delete transaction:", error);

    return {
      formError: "Unable to delete this transaction. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);
  redirect(`/w/${workspaceId}/activity`);
}
