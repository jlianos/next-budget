"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import * as v from "valibot";
import prisma from "@/db/prisma";
import { requireUser } from "@/features/auth/dal";
import { WorkspaceRole } from "@/generated/prisma/client";
import { setSelectedWorkspaceId } from "./preference";

import {
  CreateWorkspaceSchema,
  type JoinWorkspaceFormState,
  JoinWorkspaceSchema,
  type WorkspaceFormState,
} from "./validation";

export async function selectWorkspace(workspaceId: string) {
  const user = await requireUser();

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
    select: {
      workspaceId: true,
    },
  });

  if (!membership) {
    notFound();
  }

  await setSelectedWorkspaceId(user.id, membership.workspaceId);

  revalidatePath("/workspaces");
}

export async function createWorkspace(
  _previousState: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  const result = v.safeParse(CreateWorkspaceSchema, {
    name: formData.get("name"),
    currency: formData.get("currency"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof CreateWorkspaceSchema>(result.issues).nested,
    };
  }

  const user = await requireUser();
  const { name, currency } = result.output;

  let workspace: {
    id: string;
  };

  try {
    workspace = await prisma.workspace.create({
      data: {
        name,
        currency,
        users: {
          create: {
            userId: user.id,
            role: WorkspaceRole.ADMIN,
          },
        },
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    console.error("Unable to create workspace:", error);

    return {
      formError: "Unable to create your workspace. Please try again.",
    };
  }

  await setSelectedWorkspaceId(user.id, workspace.id);

  revalidatePath("/workspaces");

  return {
    successMessage: "Workspace created successfully.",
  };
}

export async function joinWorkspace(
  _previousState: JoinWorkspaceFormState,
  formData: FormData,
): Promise<JoinWorkspaceFormState> {
  const result = v.safeParse(JoinWorkspaceSchema, {
    workspaceId: formData.get("workspaceId"),
  });

  if (!result.success) {
    return {
      fieldErrors: v.flatten<typeof JoinWorkspaceSchema>(result.issues).nested,
    };
  }

  const user = await requireUser();
  const { workspaceId } = result.output;

  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!workspace) {
    return {
      formError: "No workspace was found with this ID.",
    };
  }

  try {
    await prisma.userWorkspace.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspace.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        role: WorkspaceRole.MEMBER,
      },
    });
  } catch (error) {
    console.error("Unable to join workspace:", error);

    return {
      formError: "Unable to join this workspace. Please try again.",
    };
  }

  await setSelectedWorkspaceId(user.id, workspace.id);

  revalidatePath("/workspaces");

  return {
    successMessage: `You joined ${workspace.name}.`,
  };
}
