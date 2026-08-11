import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { requireUser } from "@/features/auth/dal";
import { getPreferredWorkspace } from "@/features/workspaces/queries";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
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
