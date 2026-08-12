import "server-only";

import { cache } from "react";

import prisma from "@/db/prisma";
import { getWorkspaceMembership } from "@/features/workspaces/queries";

export const getCategoryManagementData = cache(async (userId: number, workspaceId: string) => {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    return null;
  }

  const transactionTypes = await prisma.transactionType.findMany({
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
          description: true,
          _count: {
            select: {
              transactions: true,
              recurringTransactions: true,
            },
          },
        },
      },
    },
  });

  return {
    role: membership.role,
    transactionTypes: transactionTypes.map(({ transactionCategories, ...transactionType }) => ({
      ...transactionType,
      categoryCount: transactionCategories.length,
      canDelete: transactionCategories.length === 0,
      categories: transactionCategories.map(({ _count, ...category }) => ({
        ...category,
        transactionCount: _count.transactions,
        recurringCount: _count.recurringTransactions,
        canDelete: _count.transactions === 0 && _count.recurringTransactions === 0,
      })),
    })),
  };
});
