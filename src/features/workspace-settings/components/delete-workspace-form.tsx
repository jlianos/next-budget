"use client";

import { useActionState, useId, useRef } from "react";

import { deleteWorkspace } from "../actions";
import { initialDeleteWorkspaceState } from "../validation";

type DeleteWorkspaceFormProps = {
  workspaceId: string;
  workspaceName: string;
  canDelete: boolean;
};

export function DeleteWorkspaceForm({ workspaceId, workspaceName, canDelete }: DeleteWorkspaceFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();

  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;

  const deleteThisWorkspace = deleteWorkspace.bind(null, workspaceId);

  const [state, formAction, pending] = useActionState(deleteThisWorkspace, initialDeleteWorkspaceState);

  if (!canDelete) {
    return (
      <div className="space-y-2">
        <button
          className="cursor-not-allowed rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white opacity-50"
          disabled
          type="button"
        >
          Delete workspace
        </button>

        <p className="text-sm text-amber-700">
          Delete all transactions, transfers, and recurring schedules before deleting this workspace.
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Delete workspace
      </button>

      <dialog
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
        onCancel={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
        ref={dialogRef}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-zinc-950" id={titleId}>
            Delete workspace?
          </h2>

          <p className="mt-2 text-sm text-zinc-600" id={descriptionId}>
            <strong>{workspaceName}</strong>, its wallets, categories, and member access will be permanently deleted.
            This action cannot be undone.
          </p>

          {state.formError && (
            <p aria-live="polite" className="mt-4 text-sm text-red-600" role="alert">
              {state.formError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
              disabled={pending}
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Cancel
            </button>

            <form action={formAction}>
              <button
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={pending}
                type="submit"
              >
                {pending ? "Deleting workspace…" : "Delete permanently"}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
