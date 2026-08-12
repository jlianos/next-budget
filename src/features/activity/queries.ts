import "server-only";

import { cache } from "react";
import prisma from "@/db/prisma";
import { getWorkspaceMembership } from "@/features/workspaces/queries";
import { TransactionDirection } from "@/generated/prisma/client";

export type ActivityKind = "all" | "income" | "expense" | "transfer";

type ActivityInput = {
  userId: number;
  workspaceId: string;
  start: Date;
  endExclusive: Date;
  kind?: ActivityKind;
  limit?: number;
  walletId?: number;
  transactionTypeId?: number;
  categoryId?: number;
  createdById?: number;
};

export async function getWorkspaceActivity({
  userId,
  workspaceId,
  start,
  endExclusive,
  kind = "all",
  walletId,
  transactionTypeId,
  categoryId,
  createdById,
  limit = 25,
}: ActivityInput) {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    return null;
  }

  const safeLimit = Math.min(100, Math.max(1, limit));

  const [transactions, transfers] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        ...(walletId ? { walletId } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(createdById ? { createdById } : {}),
        occurredAt: {
          gte: start,
          lt: endExclusive,
        },
        wallet: {
          workspaceId,
        },
        category: {
          transactionType: {
            workspaceId,
            ...(transactionTypeId
              ? {
                  id: transactionTypeId,
                }
              : {}),
            ...(kind === "income"
              ? {
                  direction: TransactionDirection.INCOME,
                }
              : kind === "expense"
                ? {
                    direction: TransactionDirection.EXPENSE,
                  }
                : {}),
          },
        },
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: safeLimit,
      select: {
        id: true,
        amount: true,
        occurredAt: true,
        recurringTransactionId: true,
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
      },
    }),

    prisma.transfer.findMany({
      where: {
        ...(createdById ? { createdById } : {}),
        occurredAt: {
          gte: start,
          lt: endExclusive,
        },
        fromWallet: {
          workspaceId,
        },
        toWallet: {
          workspaceId,
        },
        ...(walletId
          ? {
              OR: [
                {
                  fromWalletId: walletId,
                },
                {
                  toWalletId: walletId,
                },
              ],
            }
          : {}),
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: safeLimit,
      select: {
        id: true,
        amount: true,
        occurredAt: true,
        fromWallet: {
          select: {
            name: true,
          },
        },
        toWallet: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            email: true,
          },
        },
      },
    }),
  ]);

  const items = [
    ...(kind === "transfer"
      ? []
      : transactions.map((transaction) => ({
          kind: "transaction" as const,
          id: transaction.id,
          amount: transaction.amount.toFixed(2),
          occurredAt: transaction.occurredAt.toISOString(),
          direction: transaction.category.transactionType.direction,
          typeName: transaction.category.transactionType.name,
          categoryName: transaction.category.name,
          walletName: transaction.wallet.name,
          createdByEmail: transaction.createdBy.email,
          recurring: transaction.recurringTransactionId !== null,
        }))),

    ...(kind === "income" || kind === "expense" || transactionTypeId !== undefined || categoryId !== undefined
      ? []
      : transfers.map((transfer) => ({
          kind: "transfer" as const,
          id: transfer.id,
          amount: transfer.amount.toFixed(2),
          occurredAt: transfer.occurredAt.toISOString(),
          fromWalletName: transfer.fromWallet.name,
          toWalletName: transfer.toWallet.name,
          createdByEmail: transfer.createdBy.email,
        }))),
  ]
    .sort((first, second) => new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime())
    .slice(0, safeLimit);

  return {
    currency: membership.workspace.currency,
    items,
  };
}

export const getActivityCreators = cache(async (userId: number, workspaceId: string) => {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    return null;
  }

  const memberships = await prisma.userWorkspace.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      user: {
        email: "asc",
      },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  return memberships.map(({ user }) => user);
});
