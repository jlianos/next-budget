import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/features/auth/dal";
import { DeleteWorkspaceForm } from "@/features/workspace-settings/components/delete-workspace-form";
import { RenameWorkspaceForm } from "@/features/workspace-settings/components/rename-workspace-form";
import { getWorkspaceSettingsData } from "@/features/workspace-settings/queries";
import { WorkspaceRole } from "@/generated/prisma/client";
import { formatDateTime } from "@/lib/dates";

type SettingsPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

function formatRole(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const [user, { workspaceId }] = await Promise.all([requireUser(), params]);

  const data = await getWorkspaceSettingsData(user.id, workspaceId);

  if (!data) {
    notFound();
  }

  const canManage = data.role !== WorkspaceRole.VIEWER;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

        <p className="mt-2 text-zinc-600">Manage this workspace and its financial configuration.</p>
      </header>

      {!canManage && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-zinc-950">Read-only workspace</p>

          <p className="mt-1 text-sm text-zinc-600">Your viewer role does not allow workspace changes.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow"
          href={`/w/${workspaceId}/settings/wallets`}
        >
          <h2 className="font-semibold text-zinc-950">Wallets</h2>

          <p className="mt-2 text-sm text-zinc-600">Review balances and manage workspace wallets.</p>
        </Link>

        <Link
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow"
          href={`/w/${workspaceId}/settings/categories`}
        >
          <h2 className="font-semibold text-zinc-950">Transaction categories</h2>

          <p className="mt-2 text-sm text-zinc-600">Manage income and expense types and their categories.</p>
        </Link>
      </div>

      <section aria-labelledby="members-heading" className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="members-heading">
            Members
          </h2>

          <p className="mt-1 text-sm text-zinc-600">Everyone who currently has access to this workspace.</p>
        </div>

        <ul className="mt-5 divide-y divide-zinc-100">
          {data.members.map((member) => (
            <li className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0" key={member.id}>
              <div>
                <p className="font-medium text-zinc-950">
                  {member.email}
                  {member.id === user.id && <span className="ml-2 text-sm font-normal text-zinc-500">You</span>}
                </p>

                <p className="mt-1 text-xs text-zinc-500">Joined {formatDateTime(member.joinedAt)}</p>
              </div>

              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                {formatRole(member.role)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="workspace-heading"
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="workspace-heading">
            Workspace
          </h2>

          <p className="mt-1 text-sm text-zinc-600">Review this workspace before renaming or deleting it.</p>
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-zinc-500">Name</dt>
            <dd className="mt-1 font-medium text-zinc-950">{data.name}</dd>
          </div>

          <div>
            <dt className="text-zinc-500">Currency</dt>
            <dd className="mt-1 font-medium text-zinc-950">{data.currency}</dd>
          </div>

          <div>
            <dt className="text-zinc-500">Members</dt>
            <dd className="mt-1 font-medium text-zinc-950">{data.members.length}</dd>
          </div>

          <div>
            <dt className="text-zinc-500">Created</dt>
            <dd className="mt-1 font-medium text-zinc-950">{formatDateTime(data.createdAt)}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm">
          <p className="font-medium text-zinc-900">Financial references</p>

          <p className="mt-1 text-zinc-600">
            {data.financialCounts.transactions} transactions · {data.financialCounts.transfers} transfers ·{" "}
            {data.financialCounts.recurring} recurring schedules
          </p>

          <p className={`mt-2 ${data.canDelete ? "text-emerald-700" : "text-amber-700"}`}>
            {data.canDelete
              ? "This workspace currently qualifies for deletion."
              : "Remove all financial activity before deleting this workspace."}
          </p>
        </div>

        {canManage && (
          <div className="mt-6 max-w-md border-t border-zinc-200 pt-6">
            <h3 className="font-semibold text-zinc-950">Rename workspace</h3>

            <p className="mt-1 text-sm text-zinc-600">This name is shown to every workspace member.</p>

            <div className="mt-4">
              <RenameWorkspaceForm defaultName={data.name} key={data.name} workspaceId={workspaceId} />
            </div>
          </div>
        )}

        {canManage && (
          <div className="mt-6 border-t border-red-200 pt-6">
            <h3 className="font-semibold text-red-800">Danger zone</h3>

            <p className="mt-1 text-sm text-zinc-600">Permanently delete this workspace and its empty configuration.</p>

            <div className="mt-4">
              <DeleteWorkspaceForm canDelete={data.canDelete} workspaceId={workspaceId} workspaceName={data.name} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
