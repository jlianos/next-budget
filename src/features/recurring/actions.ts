"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";

import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";
import { parseDateTime } from "@/lib/dates";
import { DatabaseIdSchema } from "@/lib/validation";
import {
  CreateRecurringTransactionSchema,
  type RecurringStatusState,
  type RecurringTransactionFormState,
} from "./validation";

export async function createRecurringTransaction(
  workspaceId: string,
  _previousState: RecurringTransactionFormState,
  formData: FormData,
): Promise<RecurringTransactionFormState> {
  const user = await requireUser();

  const result = v.safeParse(CreateRecurringTransactionSchema, {
    amount: formData.get("amount"),
    walletId: formData.get("walletId"),
    categoryId: formData.get("categoryId"),
    frequency: formData.get("frequency"),
    interval: formData.get("interval"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") ?? "",
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CreateRecurringTransactionSchema>(result.issues).nested,
    };
  }

  const { amount, walletId, categoryId, frequency, interval, startsAt, endsAt } = result.output;

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
      formError: "Your workspace role cannot create recurring schedules.",
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

  const parsedStartsAt = parseDateTime(startsAt);
  const parsedEndsAt = endsAt === "" ? null : parseDateTime(endsAt);

  if (parsedEndsAt && parsedEndsAt.getTime() < parsedStartsAt.getTime()) {
    return {
      fieldErrors: {
        endsAt: ["The end date cannot be earlier than the start date."],
      },
    };
  }

  try {
    await prisma.recurringTransaction.create({
      data: {
        amount: new Prisma.Decimal(amount),
        walletId: wallet.id,
        categoryId: category.id,
        createdById: user.id,
        frequency,
        interval,
        startsAt: parsedStartsAt,
        endsAt: parsedEndsAt,
        nextAt: parsedStartsAt,
      },
    });
  } catch (error) {
    console.error("Unable to create recurring schedule:", error);

    return {
      formError: "Unable to save this recurring schedule. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/recurring`);
  revalidatePath(`/w/${workspaceId}/overview`);

  const transactionLabel = category.transactionType.direction === "INCOME" ? "Income" : "Expense";

  return {
    successMessage: `${transactionLabel} schedule created successfully.`,
  };
}

async function setRecurringTransactionActive(
  workspaceId: string,
  recurringTransactionId: string,
  isActive: boolean,
): Promise<RecurringStatusState> {
  const user = await requireUser();

  const idResult = v.safeParse(DatabaseIdSchema, recurringTransactionId);

  if (!idResult.success) {
    return {
      formError: "The recurring schedule is invalid.",
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
      formError: "Your workspace role cannot change recurring schedules.",
    };
  }

  try {
    const result = await prisma.recurringTransaction.updateMany({
      where: {
        id: idResult.output,
        wallet: {
          workspaceId,
        },
        category: {
          transactionType: {
            workspaceId,
          },
        },
      },
      data: {
        isActive,
      },
    });

    if (result.count !== 1) {
      return {
        formError: "This recurring schedule is unavailable.",
      };
    }
  } catch (error) {
    console.error("Unable to change recurring schedule:", error);

    return {
      formError: "Unable to change this recurring schedule. Please try again.",
    };
  }

  revalidatePath(`/w/${workspaceId}/recurring`);
  revalidatePath(`/w/${workspaceId}/overview`);

  return {
    successMessage: isActive ? "Recurring schedule started." : "Recurring schedule stopped.",
  };
}

export async function startRecurringTransaction(
  workspaceId: string,
  recurringTransactionId: string,
  _previousState: RecurringStatusState,
  _formData: FormData,
) {
  return setRecurringTransactionActive(workspaceId, recurringTransactionId, true);
}

export async function stopRecurringTransaction(
  workspaceId: string,
  recurringTransactionId: string,
  _previousState: RecurringStatusState,
  _formData: FormData,
) {
  return setRecurringTransactionActive(workspaceId, recurringTransactionId, false);
}
