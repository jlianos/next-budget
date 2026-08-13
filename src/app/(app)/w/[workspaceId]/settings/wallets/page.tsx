import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { requireUser } from "@/features/auth/dal";
import { CreateWalletForm } from "@/features/wallets/components/create-wallet-form";
import { DeleteWalletForm } from "@/features/wallets/components/delete-wallet-form";
import { RenameWalletForm } from "@/features/wallets/components/rename-wallet-form";
import { getWalletManagementData } from "@/features/wallets/queries";
import { WorkspaceRole } from "@/generated/prisma/client";

type WalletsPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WalletsPage({ params }: WalletsPageProps) {
  const [user, { workspaceId }, t, format] = await Promise.all([
    requireUser(),
    params,
    getTranslations("Wallets"),
    getFormatter(),
  ]);

  const data = await getWalletManagementData(user.id, workspaceId);

  if (!data) {
    notFound();
  }

  const canManage = data.role !== WorkspaceRole.VIEWER;
  const formatWalletMoney = (amount: string) =>
    format.number(Number(amount), {
      style: "currency",
      currency: data.currency,
    });

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

      {canManage && (
        <section
          aria-labelledby="create-wallet-heading"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight" id="create-wallet-heading">
              {t("create.title")}
            </h2>

            <p className="mt-1 text-sm text-zinc-600">{t("create.description")}</p>
          </div>

          <div className="max-w-md">
            <CreateWalletForm workspaceId={workspaceId} />
          </div>
        </section>
      )}

      {data.wallets.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.wallets.map((wallet) => {
            const negative = Number(wallet.balance) < 0;

            return (
              <li className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" key={wallet.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-zinc-950">{wallet.name}</h2>

                    <p className={`mt-2 text-xl font-semibold ${negative ? "text-red-700" : "text-zinc-950"}`}>
                      {formatWalletMoney(wallet.balance)}
                    </p>
                  </div>

                  {canManage && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        wallet.canDelete ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {wallet.canDelete ? t("badges.canDelete") : t("badges.inUse")}
                    </span>
                  )}
                </div>

                <div className="mt-5 border-t border-zinc-200 pt-4">
                  <p className="text-sm text-zinc-500">
                    {[
                      t("counts.transactions", { count: wallet.transactionCount }),
                      t("counts.transfers", { count: wallet.transferCount }),
                      t("counts.recurring", { count: wallet.recurringCount }),
                    ].join(" · ")}
                  </p>

                  {canManage && !wallet.canDelete && <p className="mt-2 text-xs text-zinc-500">{t("inUseHint")}</p>}
                </div>

                {canManage && (
                  <div className="mt-5 border-t border-zinc-200 pt-4">
                    <RenameWalletForm currentName={wallet.name} walletId={wallet.id} workspaceId={workspaceId} />

                    {wallet.canDelete && (
                      <div className="mt-5 border-t border-zinc-200 pt-4">
                        <p className="mb-3 text-xs text-zinc-500">{t("deleteHint")}</p>

                        <DeleteWalletForm walletId={wallet.id} walletName={wallet.name} workspaceId={workspaceId} />
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <h2 className="font-medium text-zinc-950">{t("empty.title")}</h2>

          <p className="mt-2 text-sm text-zinc-600">{t("empty.description")}</p>
        </div>
      )}
    </div>
  );
}
