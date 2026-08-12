import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import * as v from "valibot";
import { requireUser } from "@/features/auth/dal";
import { DeleteTransferForm } from "@/features/transfers/components/delete-transfer-form";
import { TransferForm } from "@/features/transfers/components/transfer-form";
import { getTransferForEdit, getTransferFormOptions } from "@/features/transfers/queries";
import { WorkspaceRole } from "@/generated/prisma/client";
import { formatDateTimeInput } from "@/lib/dates";
import { DatabaseIdSchema } from "@/lib/validation";

type EditTransferPageProps = {
  params: Promise<{
    workspaceId: string;
    transferId: string;
  }>;
};

export default async function EditTransferPage({ params }: EditTransferPageProps) {
  const [user, { workspaceId, transferId: rawTransferId }] = await Promise.all([requireUser(), params]);

  const transferIdResult = v.safeParse(DatabaseIdSchema, rawTransferId);

  if (!transferIdResult.success) {
    notFound();
  }

  const transferId = transferIdResult.output;

  const [options, transfer] = await Promise.all([
    getTransferFormOptions(user.id, workspaceId),
    getTransferForEdit(user.id, workspaceId, transferId),
  ]);

  if (!options || !transfer) {
    notFound();
  }

  if (options.role === WorkspaceRole.VIEWER) {
    redirect(`/w/${workspaceId}/activity`);
  }

  const occurredAt = formatDateTimeInput(transfer.occurredAt);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link className="text-sm font-medium text-zinc-600 hover:text-zinc-950" href={`/w/${workspaceId}/activity`}>
          ← Back to activity
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Edit transfer</h1>

        <p className="mt-2 text-zinc-600">Update the amount, source wallet, destination wallet, or occurrence date.</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <TransferForm
          currency={options.currency}
          defaultOccurredAt={occurredAt}
          transfer={{
            id: transfer.id,
            amount: transfer.amount,
            fromWalletId: transfer.fromWalletId,
            toWalletId: transfer.toWalletId,
            occurredAt,
          }}
          wallets={options.wallets}
          workspaceId={workspaceId}
        />
      </section>

      <section aria-labelledby="delete-transfer-heading" className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold tracking-tight text-red-900" id="delete-transfer-heading">
          Danger zone
        </h2>

        <p className="mt-2 mb-5 text-sm text-red-700">Permanently remove this transfer from the workspace.</p>

        <DeleteTransferForm transferId={transfer.id} workspaceId={workspaceId} />
      </section>
    </div>
  );
}
