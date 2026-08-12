import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/dal";
import { CreateWalletForm } from "@/features/wallets/components/create-wallet-form";
import { DeleteWalletForm } from "@/features/wallets/components/delete-wallet-form";
import { RenameWalletForm } from "@/features/wallets/components/rename-wallet-form";
import { getWalletManagementData } from "@/features/wallets/queries";
import { WorkspaceRole } from "@/generated/prisma/client";
import { formatMoney } from "@/lib/money";

type WalletsPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

function formatCount(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export default async function WalletsPage({ params }: WalletsPageProps) {
  const [user, { workspaceId }] = await Promise.all([requireUser(), params]);

  const data = await getWalletManagementData(user.id, workspaceId);

  if (!data) {
    notFound();
  }

  const canManage = data.role !== WorkspaceRole.VIEWER;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Wallets</h1>

        <p className="mt-2 text-zinc-600">Review balances and manage the wallets in this workspace.</p>
      </header>

      {!canManage && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-zinc-950">Read-only workspace</p>

          <p className="mt-1 text-sm text-zinc-600">Your viewer role does not allow wallet changes.</p>
        </div>
      )}

      {canManage && (
        <section
          aria-labelledby="create-wallet-heading"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight" id="create-wallet-heading">
              Create wallet
            </h2>

            <p className="mt-1 text-sm text-zinc-600">Add another place for tracking money in this workspace.</p>
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
                      {formatMoney(wallet.balance, data.currency)}
                    </p>
                  </div>

                  {canManage && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        wallet.canDelete ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {wallet.canDelete ? "Can delete" : "In use"}
                    </span>
                  )}
                </div>

                <div className="mt-5 border-t border-zinc-200 pt-4">
                  <p className="text-sm text-zinc-500">
                    {[
                      formatCount(wallet.transactionCount, "transaction"),
                      formatCount(wallet.transferCount, "transfer"),
                      formatCount(wallet.recurringCount, "recurring item"),
                    ].join(" · ")}
                  </p>

                  {canManage && !wallet.canDelete && (
                    <p className="mt-2 text-xs text-zinc-500">
                      This wallet cannot be deleted while financial activity references it.
                    </p>
                  )}
                </div>

                {canManage && (
                  <div className="mt-5 border-t border-zinc-200 pt-4">
                    <RenameWalletForm currentName={wallet.name} walletId={wallet.id} workspaceId={workspaceId} />

                    {wallet.canDelete && (
                      <div className="mt-5 border-t border-zinc-200 pt-4">
                        <p className="mb-3 text-xs text-zinc-500">
                          This wallet has no financial activity and can be permanently deleted.
                        </p>

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
          <h2 className="font-medium text-zinc-950">No wallets yet</h2>

          <p className="mt-2 text-sm text-zinc-600">Create your first wallet to begin recording financial activity.</p>
        </div>
      )}
    </div>
  );
}
