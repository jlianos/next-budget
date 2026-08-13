import "server-only";

import prisma from "@/db/prisma";
import { getWorkspaceMembership } from "@/features/workspaces/queries";
import { Prisma } from "@/generated/prisma/client";
import { getReportBucketKey, getReportDateBuckets } from "@/lib/dates";

type ReportsInput = {
  userId: number;
  workspaceId: string;
  start: Date;
  endExclusive: Date;
};

export async function getWorkspaceReports({ userId, workspaceId, start, endExclusive }: ReportsInput) {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    return null;
  }

  const [transactions, wallets, transfers] = await Promise.all([
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
        occurredAt: "asc",
      },
      select: {
        amount: true,
        occurredAt: true,
        wallet: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            transactionType: {
              select: {
                id: true,
                name: true,
                direction: true,
              },
            },
          },
        },
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
      select: {
        amount: true,
        fromWalletId: true,
        toWalletId: true,
      },
    }),
  ]);

  const zero = new Prisma.Decimal(0);

  const { granularity, buckets } = getReportDateBuckets(start, endExclusive);

  const trendMap = new Map(
    buckets.map((bucket) => [
      bucket.key,
      {
        ...bucket,
        income: new Prisma.Decimal(0),
        expenses: new Prisma.Decimal(0),
      },
    ]),
  );

  const walletFlowMap = new Map(
    wallets.map((wallet) => [
      wallet.id,
      {
        id: wallet.id,
        name: wallet.name,
        income: new Prisma.Decimal(0),
        expenses: new Prisma.Decimal(0),
        incomingTransfers: new Prisma.Decimal(0),
        outgoingTransfers: new Prisma.Decimal(0),
      },
    ]),
  );

  let income = zero;
  let expenses = zero;

  const expenseTypeMap = new Map<
    number,
    {
      id: number;
      name: string;
      amount: Prisma.Decimal;
    }
  >();

  const expenseCategoryMap = new Map<
    number,
    {
      id: number;
      name: string;
      typeId: number;
      typeName: string;
      amount: Prisma.Decimal;
    }
  >();

  for (const transaction of transactions) {
    const type = transaction.category.transactionType;

    const bucketKey = getReportBucketKey(transaction.occurredAt, granularity);

    const trendBucket = trendMap.get(bucketKey);
    const walletFlow = walletFlowMap.get(transaction.wallet.id);

    if (type.direction === "INCOME") {
      income = income.plus(transaction.amount);

      if (trendBucket) {
        trendBucket.income = trendBucket.income.plus(transaction.amount);
      }

      if (walletFlow) {
        walletFlow.income = walletFlow.income.plus(transaction.amount);
      }

      continue;
    }

    expenses = expenses.plus(transaction.amount);

    if (trendBucket) {
      trendBucket.expenses = trendBucket.expenses.plus(transaction.amount);
    }

    if (walletFlow) {
      walletFlow.expenses = walletFlow.expenses.plus(transaction.amount);
    }

    const existingType = expenseTypeMap.get(type.id);

    if (existingType) {
      existingType.amount = existingType.amount.plus(transaction.amount);
    } else {
      expenseTypeMap.set(type.id, {
        id: type.id,
        name: type.name,
        amount: transaction.amount,
      });
    }

    const existingCategory = expenseCategoryMap.get(transaction.category.id);

    if (existingCategory) {
      existingCategory.amount = existingCategory.amount.plus(transaction.amount);
    } else {
      expenseCategoryMap.set(transaction.category.id, {
        id: transaction.category.id,
        name: transaction.category.name,
        typeId: type.id,
        typeName: type.name,
        amount: transaction.amount,
      });
    }
  }

  for (const transfer of transfers) {
    const sourceWallet = walletFlowMap.get(transfer.fromWalletId);
    const destinationWallet = walletFlowMap.get(transfer.toWalletId);

    if (sourceWallet) {
      sourceWallet.outgoingTransfers = sourceWallet.outgoingTransfers.plus(transfer.amount);
    }

    if (destinationWallet) {
      destinationWallet.incomingTransfers = destinationWallet.incomingTransfers.plus(transfer.amount);
    }
  }

  const expenseTypes = Array.from(expenseTypeMap.values())
    .sort((first, second) => second.amount.comparedTo(first.amount))
    .map((type) => ({
      id: type.id,
      name: type.name,
      amount: type.amount.toFixed(2),
    }));

  const expenseCategories = Array.from(expenseCategoryMap.values())
    .sort((first, second) => second.amount.comparedTo(first.amount))
    .map((category) => ({
      id: category.id,
      name: category.name,
      typeId: category.typeId,
      typeName: category.typeName,
      amount: category.amount.toFixed(2),
    }));

  const trend = Array.from(trendMap.values()).map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    income: bucket.income.toFixed(2),
    expenses: bucket.expenses.toFixed(2),
    net: bucket.income.minus(bucket.expenses).toFixed(2),
  }));

  const walletFlows = Array.from(walletFlowMap.values()).map((wallet) => {
    const netChange = wallet.income
      .minus(wallet.expenses)
      .plus(wallet.incomingTransfers)
      .minus(wallet.outgoingTransfers);

    return {
      id: wallet.id,
      name: wallet.name,
      income: wallet.income.toFixed(2),
      expenses: wallet.expenses.toFixed(2),
      incomingTransfers: wallet.incomingTransfers.toFixed(2),
      outgoingTransfers: wallet.outgoingTransfers.toFixed(2),
      netChange: netChange.toFixed(2),
    };
  });

  return {
    currency: membership.workspace.currency,
    income: income.toFixed(2),
    expenses: expenses.toFixed(2),
    net: income.minus(expenses).toFixed(2),
    expenseTypes,
    expenseCategories,
    trendGranularity: granularity,
    trend,
    walletFlows,
  };
}
