import "server-only";

import prisma from "@/db/prisma";
import { getWorkspaceMembership } from "@/features/workspaces/queries";
import { Prisma, TransactionDirection } from "@/generated/prisma/client";

type OverviewSummaryInput = {
  userId: number;
  workspaceId: string;
  start: Date;
  endExclusive: Date;
  now?: Date;
};

export async function getOverviewSummary({
  userId,
  workspaceId,
  start,
  endExclusive,
  now = new Date(),
}: OverviewSummaryInput) {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    return null;
  }

  const [
    incomeResult,
    expenseResult,
    wallets,
    expenseTransactions,
    recentTransactions,
    recentTransfers,
    upcomingRecurring,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
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
            direction: TransactionDirection.EXPENSE,
          },
        },
      },
      _sum: {
        amount: true,
      },
    }),

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

    prisma.transaction.findMany({
      where: {
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
            direction: TransactionDirection.EXPENSE,
          },
        },
      },
      select: {
        amount: true,
        category: {
          select: {
            id: true,
            name: true,
            transactionType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),

    prisma.transaction.findMany({
      where: {
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
          },
        },
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: 5,
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
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: 5,
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

    prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextAt: {
          gte: now,
        },
        wallet: {
          workspaceId,
        },
        category: {
          transactionType: {
            workspaceId,
          },
        },
        OR: [
          {
            endsAt: null,
          },
          {
            endsAt: {
              gte: now,
            },
          },
        ],
      },
      orderBy: {
        nextAt: "asc",
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        frequency: true,
        interval: true,
        nextAt: true,
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
                direction: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const zero = new Prisma.Decimal(0);

  const income = incomeResult._sum.amount ?? zero;
  const expenses = expenseResult._sum.amount ?? zero;

  const walletBalances = await Promise.all(
    wallets.map(async (wallet) => {
      const [walletIncomeResult, walletExpenseResult, incomingTransferResult, outgoingTransferResult] =
        await Promise.all([
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

      const walletIncome = walletIncomeResult._sum.amount ?? zero;
      const walletExpenses = walletExpenseResult._sum.amount ?? zero;
      const incomingTransfers = incomingTransferResult._sum.amount ?? zero;
      const outgoingTransfers = outgoingTransferResult._sum.amount ?? zero;

      const balance = walletIncome.minus(walletExpenses).plus(incomingTransfers).minus(outgoingTransfers);

      return {
        id: wallet.id,
        name: wallet.name,
        balance: balance.toFixed(2),
      };
    }),
  );

  const expenseCategoryMap = new Map<
    number,
    {
      id: number;
      name: string;
      typeName: string;
      amount: Prisma.Decimal;
    }
  >();

  for (const transaction of expenseTransactions) {
    const existing = expenseCategoryMap.get(transaction.category.id);

    if (existing) {
      existing.amount = existing.amount.plus(transaction.amount);
      continue;
    }

    expenseCategoryMap.set(transaction.category.id, {
      id: transaction.category.id,
      name: transaction.category.name,
      typeName: transaction.category.transactionType.name,
      amount: transaction.amount,
    });
  }

  const expenseCategories = Array.from(expenseCategoryMap.values())
    .sort((first, second) => second.amount.comparedTo(first.amount))
    .map((category) => ({
      id: category.id,
      name: category.name,
      typeName: category.typeName,
      amount: category.amount.toFixed(2),
    }));

  const recentActivity = [
    ...recentTransactions.map((transaction) => ({
      kind: "transaction" as const,
      id: transaction.id,
      amount: transaction.amount.toFixed(2),
      occurredAt: transaction.occurredAt.toISOString(),
      direction: transaction.category.transactionType.direction,
      categoryName: transaction.category.name,
      walletName: transaction.wallet.name,
      createdByEmail: transaction.createdBy.email,
      recurring: transaction.recurringTransactionId !== null,
    })),

    ...recentTransfers.map((transfer) => ({
      kind: "transfer" as const,
      id: transfer.id,
      amount: transfer.amount.toFixed(2),
      occurredAt: transfer.occurredAt.toISOString(),
      fromWalletName: transfer.fromWallet.name,
      toWalletName: transfer.toWallet.name,
      createdByEmail: transfer.createdBy.email,
    })),
  ]
    .sort((first, second) => new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime())
    .slice(0, 5);

  const upcomingRecurringItems = upcomingRecurring.map((item) => ({
    id: item.id,
    amount: item.amount.toFixed(2),
    frequency: item.frequency,
    interval: item.interval,
    nextAt: item.nextAt.toISOString(),
    walletName: item.wallet.name,
    categoryName: item.category.name,
    direction: item.category.transactionType.direction,
  }));

  return {
    currency: membership.workspace.currency,
    income: income.toFixed(2),
    expenses: expenses.toFixed(2),
    net: income.minus(expenses).toFixed(2),
    wallets: walletBalances,
    expenseCategories,
    recentActivity,
    upcomingRecurring: upcomingRecurringItems,
  };
}
