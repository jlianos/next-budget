import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { requireUser } from "@/features/auth/dal";
import { QuickAddTransactionDialog } from "@/features/transactions/components/quick-add-transaction-dialog";
import { getTransactionFormOptions } from "@/features/transactions/queries";
import { getWorkspaceMembership } from "@/features/workspaces/queries";
import { WorkspaceRole } from "@/generated/prisma/client";
import { formatDateTimeInput } from "@/lib/dates";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const user = await requireUser();
  const { workspaceId } = await params;
  const [membership, transactionOptions] = await Promise.all([
    getWorkspaceMembership(user.id, workspaceId),
    getTransactionFormOptions(user.id, workspaceId),
  ]);

  if (!membership || !transactionOptions) {
    notFound();
  }

  const selectedWorkspace = {
    ...membership.workspace,
    role: membership.role,
  };

  return (
    <AppShell selectedWorkspace={selectedWorkspace} userEmail={user.email}>
      {membership.role !== WorkspaceRole.VIEWER && (
        <QuickAddTransactionDialog
          currency={transactionOptions.currency}
          initialOccurredAt={formatDateTimeInput()}
          transactionTypes={transactionOptions.transactionTypes}
          wallets={transactionOptions.wallets}
          workspaceId={workspaceId}
        />
      )}

      {children}
    </AppShell>
  );
}
