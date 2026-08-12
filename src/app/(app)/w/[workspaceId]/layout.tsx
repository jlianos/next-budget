import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { requireUser } from "@/features/auth/dal";
import { getWorkspaceMembership } from "@/features/workspaces/queries";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const user = await requireUser();
  const { workspaceId } = await params;
  const membership = await getWorkspaceMembership(user.id, workspaceId);

  if (!membership) {
    notFound();
  }

  const selectedWorkspace = {
    ...membership.workspace,
    role: membership.role,
  };

  return (
    <AppShell selectedWorkspace={selectedWorkspace} userEmail={user.email}>
      {children}
    </AppShell>
  );
}
