import "server-only";

import { cache } from "react";

import prisma from "@/db/prisma";
import { getWorkspaceMembership } from "@/features/workspaces/queries";

export const getWorkspaceSettingsData = cache(async (userId: number, workspaceId: string) => {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    return null;
  }

  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },
    select: {
      id: true,
      name: true,
      currency: true,
      createdAt: true,
      users: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
      wallets: {
        select: {
          _count: {
            select: {
              transactions: true,
              outgoingTransfers: true,
              recurringTransactions: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  const financialCounts = workspace.wallets.reduce(
    (counts, wallet) => ({
      transactions: counts.transactions + wallet._count.transactions,
      transfers: counts.transfers + wallet._count.outgoingTransfers,
      recurring: counts.recurring + wallet._count.recurringTransactions,
    }),
    {
      transactions: 0,
      transfers: 0,
      recurring: 0,
    },
  );

  return {
    id: workspace.id,
    name: workspace.name,
    currency: workspace.currency,
    role: membership.role,
    createdAt: workspace.createdAt.toISOString(),
    members: workspace.users.map((workspaceUser) => ({
      id: workspaceUser.user.id,
      email: workspaceUser.user.email,
      role: workspaceUser.role,
      joinedAt: workspaceUser.createdAt.toISOString(),
    })),
    financialCounts,
    canDelete: financialCounts.transactions === 0 && financialCounts.transfers === 0 && financialCounts.recurring === 0,
  };
});
