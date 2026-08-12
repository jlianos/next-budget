import "server-only";

import { cache } from "react";

import prisma from "@/db/prisma";
import { getWorkspaceMembership } from "@/features/workspaces/queries";

export const getTransferFormOptions = cache(async (userId: number, workspaceId: string) => {
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
    },
  });

  return {
    currency: membership.workspace.currency,
    role: membership.role,
    wallets,
  };
});

export const getTransferForEdit = cache(async (userId: number, workspaceId: string, transferId: number) => {
  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    return null;
  }

  const transfer = await prisma.transfer.findFirst({
    where: {
      id: transferId,
      fromWallet: {
        workspaceId,
      },
      toWallet: {
        workspaceId,
      },
    },
    select: {
      id: true,
      amount: true,
      fromWalletId: true,
      toWalletId: true,
      occurredAt: true,
    },
  });

  if (!transfer) {
    return null;
  }

  return {
    id: transfer.id,
    amount: transfer.amount.toFixed(2),
    fromWalletId: transfer.fromWalletId,
    toWalletId: transfer.toWalletId,
    occurredAt: transfer.occurredAt,
  };
});
