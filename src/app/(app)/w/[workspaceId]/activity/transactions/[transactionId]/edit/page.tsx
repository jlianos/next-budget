import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import * as v from "valibot";
import { requireUser } from "@/features/auth/dal";
import { DeleteTransactionForm } from "@/features/transactions/components/delete-transaction-form";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { getTransactionForEdit, getTransactionFormOptions } from "@/features/transactions/queries";
import { WorkspaceRole } from "@/generated/prisma/client";
import { formatDateTimeInput } from "@/lib/dates";
import { DatabaseIdSchema } from "@/lib/validation";

type EditTransactionPageProps = {
  params: Promise<{
    workspaceId: string;
    transactionId: string;
  }>;
};

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const [user, { workspaceId, transactionId: rawTransactionId }] = await Promise.all([requireUser(), params]);

  const transactionIdResult = v.safeParse(DatabaseIdSchema, rawTransactionId);

  if (!transactionIdResult.success) {
    notFound();
  }

  const transactionId = transactionIdResult.output;

  const [options, transaction] = await Promise.all([
    getTransactionFormOptions(user.id, workspaceId),
    getTransactionForEdit(user.id, workspaceId, transactionId),
  ]);

  if (!options || !transaction) {
    notFound();
  }

  if (options.role === WorkspaceRole.VIEWER) {
    redirect(`/w/${workspaceId}/activity`);
  }

  const occurredAt = formatDateTimeInput(transaction.occurredAt);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link className="text-sm font-medium text-zinc-600 hover:text-zinc-950" href={`/w/${workspaceId}/activity`}>
          ← Back to activity
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Edit transaction</h1>

        <p className="mt-2 text-zinc-600">Update the amount, wallet, category, or occurrence date.</p>
      </header>

      {transaction.recurring && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This is a generated recurring transaction. Editing it changes only this occurrence, not its recurring
          schedule.
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <TransactionForm
          currency={options.currency}
          defaultOccurredAt={occurredAt}
          transaction={{
            id: transaction.id,
            amount: transaction.amount,
            walletId: transaction.walletId,
            categoryId: transaction.categoryId,
            occurredAt,
          }}
          transactionTypes={options.transactionTypes}
          wallets={options.wallets}
          workspaceId={workspaceId}
        />
      </section>

      <section aria-labelledby="delete-transaction-heading" className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold tracking-tight text-red-900" id="delete-transaction-heading">
          Danger zone
        </h2>

        <p className="mt-2 mb-5 text-sm text-red-700">Permanently remove this transaction from the workspace.</p>

        <DeleteTransactionForm
          recurring={transaction.recurring}
          transactionId={transaction.id}
          workspaceId={workspaceId}
        />
      </section>
    </div>
  );
}
