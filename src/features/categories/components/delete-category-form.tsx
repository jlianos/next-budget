"use client";

import { useActionState, useRef } from "react";

import { deleteTransactionCategory } from "../actions";
import { initialDeleteCategoryItemFormState } from "../validation";

type DeleteCategoryFormProps = {
  workspaceId: string;
  categoryId: number;
  categoryName: string;
};

export function DeleteCategoryForm({ workspaceId, categoryId, categoryName }: DeleteCategoryFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const deleteThisCategory = deleteTransactionCategory.bind(null, workspaceId, String(categoryId));

  const [state, formAction, pending] = useActionState(deleteThisCategory, initialDeleteCategoryItemFormState);

  const titleId = `delete-category-${categoryId}-title`;
  const descriptionId = `delete-category-${categoryId}-description`;

  return (
    <>
      <button
        className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Delete category
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
            Delete category?
          </h2>

          <p className="mt-2 text-sm text-zinc-600" id={descriptionId}>
            <strong>{categoryName}</strong> will be permanently deleted. This action cannot be undone.
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
                {pending ? "Deleting…" : "Delete permanently"}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
