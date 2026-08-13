"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import * as v from "valibot";

import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";
import { parseDateTime } from "@/lib/dates";
import { DatabaseIdSchema } from "@/lib/validation";
import {
  createRecurringTransactionSchema,
  type RecurringStatusState,
  type RecurringTransactionFormState,
} from "./validation";

async function getRecurringActionContext() {
  const t = await getTranslations("Recurring.feedback");
  const schema = createRecurringTransactionSchema({
    selectOption: t("validation.selectOption"),
    invalidOption: t("validation.invalidOption"),
    amountRequired: t("validation.amountRequired"),
    amountInvalid: t("validation.amountInvalid"),
    amountPrecision: t("validation.amountPrecision"),
    amountPositive: t("validation.amountPositive"),
    frequencyRequired: t("validation.frequencyRequired"),
    intervalRequired: t("validation.intervalRequired"),
    intervalWhole: t("validation.intervalWhole"),
    intervalMinimum: t("validation.intervalMinimum"),
    dateRequired: t("validation.dateRequired"),
    dateInvalid: t("validation.dateInvalid"),
    endBeforeStart: t("validation.endBeforeStart"),
  });

  return { schema, t };
}

export async function createRecurringTransaction(
  workspaceId: string,
  _previousState: RecurringTransactionFormState,
  formData: FormData,
): Promise<RecurringTransactionFormState> {
  const [user, { schema: CreateRecurringTransactionSchema, t }] = await Promise.all([
    requireUser(),
    getRecurringActionContext(),
  ]);

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

  const parsedStartsAt = parseDateTime(startsAt);
  const parsedEndsAt = endsAt === "" ? null : parseDateTime(endsAt);

  if (parsedEndsAt && parsedEndsAt.getTime() < parsedStartsAt.getTime()) {
    return {
      fieldErrors: {
        endsAt: [t("validation.endBeforeStart")],
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
      formError: t("saveFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/recurring`);
  revalidatePath(`/w/${workspaceId}/overview`);

  return {
    successMessage: category.transactionType.direction === "INCOME" ? t("incomeCreated") : t("expenseCreated"),
  };
}

async function setRecurringTransactionActive(
  workspaceId: string,
  recurringTransactionId: string,
  isActive: boolean,
): Promise<RecurringStatusState> {
  const [user, t] = await Promise.all([requireUser(), getTranslations("Recurring.feedback")]);

  const idResult = v.safeParse(DatabaseIdSchema, recurringTransactionId);

  if (!idResult.success) {
    return {
      formError: t("invalidSchedule"),
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
      formError: t("cannotChange"),
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
        formError: t("scheduleUnavailable"),
      };
    }
  } catch (error) {
    console.error("Unable to change recurring schedule:", error);

    return {
      formError: t("changeFailed"),
    };
  }

  revalidatePath(`/w/${workspaceId}/recurring`);
  revalidatePath(`/w/${workspaceId}/overview`);

  return {
    successMessage: isActive ? t("started") : t("stopped"),
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
