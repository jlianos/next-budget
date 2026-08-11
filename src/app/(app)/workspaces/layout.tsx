import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { requireUser } from "@/features/auth/dal";
import { getPreferredWorkspace } from "@/features/workspaces/queries";

type WorkspacesLayoutProps = {
  children: ReactNode;
};

export default async function WorkspacesLayout({
  children,
}: WorkspacesLayoutProps) {
  const user = await requireUser();
  const preferredMembership = await getPreferredWorkspace(user.id);

  const selectedWorkspace = preferredMembership
    ? {
        ...preferredMembership.workspace,
        role: preferredMembership.role,
      }
    : null;

  return (
    <AppShell selectedWorkspace={selectedWorkspace} userEmail={user.email}>
      {children}
    </AppShell>
  );
}
