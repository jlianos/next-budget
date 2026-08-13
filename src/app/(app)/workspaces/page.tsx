import { getTranslations } from "next-intl/server";

import { requireUser } from "@/features/auth/dal";
import { selectWorkspace } from "@/features/workspaces/actions";
import { CopyWorkspaceIdButton } from "@/features/workspaces/components/copy-workspace-id-button";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { JoinWorkspaceForm } from "@/features/workspaces/components/join-workspace-form";
import { getPreferredWorkspace, getUserWorkspaces } from "@/features/workspaces/queries";
import { WorkspaceRole } from "@/generated/prisma/client";

export default async function Home() {
  const [user, t] = await Promise.all([requireUser(), getTranslations("Workspaces")]);
  const [memberships, preferredMembership] = await Promise.all([
    getUserWorkspaces(user.id),
    getPreferredWorkspace(user.id),
  ]);

  const selectedWorkspaceId = preferredMembership?.workspace.id ?? null;
  const roleLabels: Record<WorkspaceRole, string> = {
    [WorkspaceRole.ADMIN]: t("roles.admin"),
    [WorkspaceRole.MEMBER]: t("roles.member"),
    [WorkspaceRole.VIEWER]: t("roles.viewer"),
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl space-y-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-950">{t("title")}</h2>

            <p className="text-sm text-zinc-600">{t("description")}</p>
          </div>

          {memberships.length > 0 ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {memberships.map(({ role, workspace }) => {
                const selectThisWorkspace = selectWorkspace.bind(null, workspace.id);
                const selected = workspace.id === selectedWorkspaceId;

                return (
                  <li
                    className={`overflow-hidden rounded-xl border transition ${
                      selected ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10" : "border-zinc-200 bg-white"
                    }`}
                    key={workspace.id}
                  >
                    <form action={selectThisWorkspace}>
                      <button aria-pressed={selected} className="w-full p-4 text-left hover:bg-zinc-50" type="submit">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-zinc-950">{workspace.name}</h3>

                            <p className="mt-1 text-sm text-zinc-500">{workspace.currency}</p>
                          </div>

                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                            {roleLabels[role]}
                          </span>
                        </div>
                      </button>
                    </form>

                    <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3">
                      <code className="min-w-0 truncate text-xs text-zinc-500" title={workspace.id}>
                        {workspace.id}
                      </code>

                      <div className="shrink-0">
                        <CopyWorkspaceIdButton workspaceId={workspace.id} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-6 text-center">
              <h3 className="font-medium text-zinc-950">{t("emptyTitle")}</h3>

              <p className="mt-2 text-sm text-zinc-600">{t("emptyDescription")}</p>
            </div>
          )}
        </section>
        <div className="grid gap-8 md:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-zinc-950">{t("createTitle")}</h2>

              <p className="text-sm text-zinc-600">{t("createDescription")}</p>
            </div>

            <CreateWorkspaceForm />
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-zinc-950">{t("joinTitle")}</h2>

              <p className="text-sm text-zinc-600">{t("joinDescription")}</p>
            </div>

            <JoinWorkspaceForm />
          </section>
        </div>
      </div>
    </div>
  );
}
