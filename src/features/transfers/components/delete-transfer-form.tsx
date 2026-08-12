"use client";

import { useActionState, useState } from "react";

import { deleteTransfer } from "../actions";
import { initialDeleteTransferState } from "../validation";

type DeleteTransferFormProps = {
  workspaceId: string;
  transferId: number;
};

export function DeleteTransferForm({ workspaceId, transferId }: DeleteTransferFormProps) {
  const [confirming, setConfirming] = useState(false);

  const deleteForWorkspace = deleteTransfer.bind(null, workspaceId, transferId.toString());

  const [state, formAction, pending] = useActionState(deleteForWorkspace, initialDeleteTransferState);

  if (!confirming) {
    return (
      <button
        className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
        onClick={() => setConfirming(true)}
        type="button"
      >
        Delete transfer
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <p className="font-medium text-red-800">Permanently delete this transfer?</p>

        <p className="mt-1 text-sm text-red-700">This cannot be undone and will change both wallet balances.</p>
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
          {pending ? "Deleting transfer…" : "Delete permanently"}
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
