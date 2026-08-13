import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import { requireUser } from "@/features/auth/dal";
import { DeleteWorkspaceForm } from "@/features/workspace-settings/components/delete-workspace-form";
import { RenameWorkspaceForm } from "@/features/workspace-settings/components/rename-workspace-form";
import { getWorkspaceSettingsData } from "@/features/workspace-settings/queries";
import { WorkspaceRole } from "@/generated/prisma/client";

type SettingsPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const [user, { workspaceId }, t, format] = await Promise.all([
    requireUser(),
    params,
    getTranslations("WorkspaceSettings"),
    getFormatter(),
  ]);

  const data = await getWorkspaceSettingsData(user.id, workspaceId);

  if (!data) {
    notFound();
  }

  const canManage = data.role !== WorkspaceRole.VIEWER;
  const formatSettingsDate = (value: string) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const roleLabels = {
    ADMIN: t("members.roles.admin"),
    MEMBER: t("members.roles.member"),
    VIEWER: t("members.roles.viewer"),
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

        <p className="mt-2 text-zinc-600">{t("description")}</p>
      </header>

      {!canManage && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-zinc-950">{t("readOnly.title")}</p>

          <p className="mt-1 text-sm text-zinc-600">{t("readOnly.description")}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow"
          href={`/w/${workspaceId}/settings/wallets`}
        >
          <h2 className="font-semibold text-zinc-950">{t("links.wallets")}</h2>

          <p className="mt-2 text-sm text-zinc-600">{t("links.walletsDescription")}</p>
        </Link>

        <Link
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow"
          href={`/w/${workspaceId}/settings/categories`}
        >
          <h2 className="font-semibold text-zinc-950">{t("links.categories")}</h2>

          <p className="mt-2 text-sm text-zinc-600">{t("links.categoriesDescription")}</p>
        </Link>
      </div>

      <section aria-labelledby="members-heading" className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" id="members-heading">
            {t("members.title")}
          </h2>

          <p className="mt-1 text-sm text-zinc-600">{t("members.description")}</p>
        </div>

        <ul className="mt-5 divide-y divide-zinc-100">
          {data.members.map((member) => (
            <li className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0" key={member.id}>
              <div>
                <p className="font-medium text-zinc-950">
                  {member.email}
                  {member.id === user.id && (
                    <span className="ml-2 text-sm font-normal text-zinc-500">{t("members.you")}</span>
                  )}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {t("members.joined", { date: formatSettingsDate(member.joinedAt) })}
                </p>
              </div>

              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                {roleLabels[member.role]}
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
            {t("workspace.title")}
          </h2>

          <p className="mt-1 text-sm text-zinc-600">{t("workspace.description")}</p>
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-zinc-500">{t("workspace.name")}</dt>
            <dd className="mt-1 font-medium text-zinc-950">{data.name}</dd>
          </div>

          <div>
            <dt className="text-zinc-500">{t("workspace.currency")}</dt>
            <dd className="mt-1 font-medium text-zinc-950">{data.currency}</dd>
          </div>

          <div>
            <dt className="text-zinc-500">{t("workspace.members")}</dt>
            <dd className="mt-1 font-medium text-zinc-950">{data.members.length}</dd>
          </div>

          <div>
            <dt className="text-zinc-500">{t("workspace.created")}</dt>
            <dd className="mt-1 font-medium text-zinc-950">{formatSettingsDate(data.createdAt)}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm">
          <p className="font-medium text-zinc-900">{t("references.title")}</p>

          <p className="mt-1 text-zinc-600">
            {t("references.transactions", { count: data.financialCounts.transactions })} ·{" "}
            {t("references.transfers", { count: data.financialCounts.transfers })} ·{" "}
            {t("references.recurring", { count: data.financialCounts.recurring })}
          </p>

          <p className={`mt-2 ${data.canDelete ? "text-emerald-700" : "text-amber-700"}`}>
            {data.canDelete ? t("references.canDelete") : t("references.cannotDelete")}
          </p>
        </div>

        {canManage && (
          <div className="mt-6 max-w-md border-t border-zinc-200 pt-6">
            <h3 className="font-semibold text-zinc-950">{t("rename.title")}</h3>

            <p className="mt-1 text-sm text-zinc-600">{t("rename.description")}</p>

            <div className="mt-4">
              <RenameWorkspaceForm defaultName={data.name} key={data.name} workspaceId={workspaceId} />
            </div>
          </div>
        )}

        {canManage && (
          <div className="mt-6 border-t border-red-200 pt-6">
            <h3 className="font-semibold text-red-800">{t("danger.title")}</h3>

            <p className="mt-1 text-sm text-zinc-600">{t("danger.description")}</p>

            <div className="mt-4">
              <DeleteWorkspaceForm canDelete={data.canDelete} workspaceId={workspaceId} workspaceName={data.name} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
