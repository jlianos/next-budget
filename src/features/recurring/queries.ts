import "server-only";

import { cache } from "react";

import prisma from "@/db/prisma";
import { getTransactionFormOptions } from "@/features/transactions/queries";

export const getRecurringManagementData = cache(async (userId: number, workspaceId: string) => {
  const options = await getTransactionFormOptions(userId, workspaceId);

  if (!options) {
    return null;
  }

  const recurringTransactions = await prisma.recurringTransaction.findMany({
    where: {
      wallet: {
        workspaceId,
      },
      category: {
        transactionType: {
          workspaceId,
        },
      },
    },
    orderBy: [
      {
        isActive: "desc",
      },
      {
        nextAt: "asc",
      },
    ],
    select: {
      id: true,
      amount: true,
      frequency: true,
      interval: true,
      startsAt: true,
      endsAt: true,
      nextAt: true,
      isActive: true,
      wallet: {
        select: {
          name: true,
        },
      },
      category: {
        select: {
          name: true,
          transactionType: {
            select: {
              name: true,
              direction: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  return {
    currency: options.currency,
    role: options.role,
    wallets: options.wallets,
    transactionTypes: options.transactionTypes,
    recurringTransactions: recurringTransactions.map((recurring) => ({
      id: recurring.id,
      amount: recurring.amount.toFixed(2),
      frequency: recurring.frequency,
      interval: recurring.interval,
      startsAt: recurring.startsAt.toISOString(),
      endsAt: recurring.endsAt?.toISOString() ?? null,
      nextAt: recurring.nextAt.toISOString(),
      isActive: recurring.isActive,
      walletName: recurring.wallet.name,
      categoryName: recurring.category.name,
      transactionTypeName: recurring.category.transactionType.name,
      direction: recurring.category.transactionType.direction,
      createdByEmail: recurring.createdBy.email,
      generatedCount: recurring._count.transactions,
    })),
  };
});
