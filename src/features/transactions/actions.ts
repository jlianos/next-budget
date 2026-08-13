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

import { createTransactionSchema, type DeleteTransactionState, type TransactionFormState } from "./validation";

async function getTransactionActionContext() {
  const t = await getTranslations("Transactions.feedback");
  const schema = createTransactionSchema({
    selectOption: t("validation.selectOption"),
    invalidOption: t("validation.invalidOption"),
    amountRequired: t("validation.amountRequired"),
    amountInvalid: t("validation.amountInvalid"),
    amountPrecision: t("validation.amountPrecision"),
    amountPositive: t("validation.amountPositive"),
    dateRequired: t("validation.dateRequired"),
    dateInvalid: t("validation.dateInvalid"),
  });

  return { schema, t };
}

export async function createTransaction(
  workspaceId: string,
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const [user, { schema: CreateTransactionSchema, t }] = await Promise.all([
    requireUser(),
    getTransactionActionContext(),
  ]);

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
      formError: t("noAccess"),
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: t("cannotCreate"),
    };
  }

  if (!wallet) {
    return {
      fieldErrors: {
        walletId: [t("walletUnavailable")],
      },
    };
  }

  if (!category) {
    return {
      fieldErrors: {
        categoryId: [t("categoryUnavailable")],
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
      formError: t("saveFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);

  return {
    successMessage: category.transactionType.direction === "INCOME" ? t("incomeRecorded") : t("expenseRecorded"),
  };
}

export async function updateTransaction(
  workspaceId: string,
  transactionId: string,
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const [user, { schema: CreateTransactionSchema, t }] = await Promise.all([
    requireUser(),
    getTransactionActionContext(),
  ]);

  const transactionIdResult = v.safeParse(DatabaseIdSchema, transactionId);

  if (!transactionIdResult.success) {
    return {
      formError: t("transactionInvalid"),
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
      formError: t("noAccess"),
    };
  }

  if (membership.role === WorkspaceRole.VIEWER) {
    return {
      formError: t("cannotEdit"),
    };
  }

  if (!transaction) {
    return {
      formError: t("transactionUnavailable"),
    };
  }

  if (!wallet) {
    return {
      fieldErrors: {
        walletId: [t("walletUnavailable")],
      },
    };
  }

  if (!category) {
    return {
      fieldErrors: {
        categoryId: [t("categoryUnavailable")],
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
      formError: t("updateFailed"),
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
  const [user, t] = await Promise.all([requireUser(), getTranslations("Transactions.feedback")]);

  const transactionIdResult = v.safeParse(DatabaseIdSchema, transactionId);

  if (!transactionIdResult.success) {
    return {
      formError: t("transactionInvalid"),
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
        formError: t("transactionUnavailable"),
      };
    }
  } catch (error) {
    console.error("Unable to delete transaction:", error);

    return {
      formError: t("deleteFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/overview`);
  revalidatePath(`/w/${workspaceId}/activity`);
  redirect(`/w/${workspaceId}/activity`);
}
