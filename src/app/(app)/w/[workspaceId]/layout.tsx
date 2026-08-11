import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { requireUser } from "@/features/auth/dal";
import { getUserWorkspaces } from "@/features/workspaces/queries";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const user = await requireUser();
  const { workspaceId } = await params;
  const memberships = await getUserWorkspaces(user.id);

  const membership = memberships.find(({ workspace }) => workspace.id === workspaceId);

  if (!membership) {
    notFound();
  }

  return children;
}
