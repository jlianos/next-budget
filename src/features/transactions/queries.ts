import "server-only";

import { cache } from "react";

import prisma from "@/db/prisma";
import { getWorkspaceMembership } from "@/features/workspaces/queries";

export const getTransactionFormOptions = cache(async (userId: number, workspaceId: string) => {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    return null;
  }

  const [wallets, transactionTypes] = await Promise.all([
    prisma.wallet.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.transactionType.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        direction: true,
        transactionCategories: {
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    currency: membership.workspace.currency,
    role: membership.role,
    wallets,
    transactionTypes,
  };
});

export const getTransactionForEdit = cache(async (userId: number, workspaceId: string, transactionId: number) => {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    return null;
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
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
      amount: true,
      walletId: true,
      categoryId: true,
      occurredAt: true,
      recurringTransactionId: true,
    },
  });

  if (!transaction) {
    return null;
  }

  return {
    id: transaction.id,
    amount: transaction.amount.toFixed(2),
    walletId: transaction.walletId,
    categoryId: transaction.categoryId,
    occurredAt: transaction.occurredAt,
    recurring: transaction.recurringTransactionId !== null,
  };
});
