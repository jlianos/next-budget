import "server-only";

import { cache } from "react";

import prisma from "@/db/prisma";

import { getSelectedWorkspaceId } from "./preference";

export const getUserWorkspaces = cache((userId: number) => {
  return prisma.userWorkspace.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          currency: true,
        },
      },
    },
  });
});

export const getPreferredWorkspace = cache(async (userId: number) => {
  const [memberships, selectedWorkspaceId] = await Promise.all([
    getUserWorkspaces(userId),
    getSelectedWorkspaceId(userId),
  ]);

  const selectedMembership = memberships.find(({ workspace }) => workspace.id === selectedWorkspaceId);

  return selectedMembership ?? memberships[0] ?? null;
});

export const getWorkspaceMembership = cache((userId: number, workspaceId: string) => {
  return prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          currency: true,
        },
      },
    },
  });
});
