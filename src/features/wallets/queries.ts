import "server-only";

import { cache } from "react";

import prisma from "@/db/prisma";
import { getWorkspaceMembership } from "@/features/workspaces/queries";
import { Prisma, TransactionDirection } from "@/generated/prisma/client";

export const getWalletManagementData = cache(async (userId: number, workspaceId: string) => {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    return null;
  }

  const wallets = await prisma.wallet.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
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

  const zero = new Prisma.Decimal(0);

  const walletItems = await Promise.all(
    wallets.map(async (wallet) => {
      const [incomeResult, expenseResult, incomingTransferResult, outgoingTransferResult] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            walletId: wallet.id,
            category: {
              transactionType: {
                workspaceId,
                direction: TransactionDirection.INCOME,
              },
            },
          },
          _sum: {
            amount: true,
          },
        }),

        prisma.transaction.aggregate({
          where: {
            walletId: wallet.id,
            category: {
              transactionType: {
                workspaceId,
                direction: TransactionDirection.EXPENSE,
              },
            },
          },
          _sum: {
            amount: true,
          },
        }),

        prisma.transfer.aggregate({
          where: {
            toWalletId: wallet.id,
            fromWallet: {
              workspaceId,
            },
          },
          _sum: {
            amount: true,
          },
        }),

        prisma.transfer.aggregate({
          where: {
            fromWalletId: wallet.id,
            toWallet: {
              workspaceId,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      const income = incomeResult._sum.amount ?? zero;
      const expenses = expenseResult._sum.amount ?? zero;
      const incomingTransfers = incomingTransferResult._sum.amount ?? zero;
      const outgoingTransfers = outgoingTransferResult._sum.amount ?? zero;

      const balance = income.minus(expenses).plus(incomingTransfers).minus(outgoingTransfers);

      const transactionCount = wallet._count.transactions;
      const transferCount = wallet._count.incomingTransfers + wallet._count.outgoingTransfers;
      const recurringCount = wallet._count.recurringTransactions;

      return {
        id: wallet.id,
        name: wallet.name,
        balance: balance.toFixed(2),
        transactionCount,
        transferCount,
        recurringCount,
        canDelete: transactionCount === 0 && transferCount === 0 && recurringCount === 0,
      };
    }),
  );

  return {
    currency: membership.workspace.currency,
    role: membership.role,
    wallets: walletItems,
  };
});
