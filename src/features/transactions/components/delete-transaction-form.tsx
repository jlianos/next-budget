"use client";

import { useActionState, useState } from "react";

import { deleteTransaction } from "../actions";
import { initialDeleteTransactionState } from "../validation";

type DeleteTransactionFormProps = {
  workspaceId: string;
  transactionId: number;
  recurring: boolean;
};

export function DeleteTransactionForm({ workspaceId, transactionId, recurring }: DeleteTransactionFormProps) {
  const [confirming, setConfirming] = useState(false);

  const deleteForWorkspace = deleteTransaction.bind(null, workspaceId, transactionId.toString());

  const [state, formAction, pending] = useActionState(deleteForWorkspace, initialDeleteTransactionState);

  if (!confirming) {
    return (
      <button
        className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
        onClick={() => setConfirming(true)}
        type="button"
      >
        Delete transaction
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <p className="font-medium text-red-800">Permanently delete this transaction?</p>

        <p className="mt-1 text-sm text-red-700">This cannot be undone and will affect the workspace totals.</p>

        {recurring && (
          <p className="mt-2 text-sm text-red-700">
            The recurring schedule will remain active and may generate this occurrence again in the future.
          </p>
        )}
      </div>

      {state.formError && (
        <p aria-live="polite" className="text-sm text-red-700" role="alert">
          {state.formError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Deleting transaction…" : "Delete permanently"}
        </button>

        <button
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          disabled={pending}
          onClick={() => setConfirming(false)}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
