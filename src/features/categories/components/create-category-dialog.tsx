"use client";

import { useEffect, useId, useRef, useState } from "react";

import { CreateCategoryForm } from "./create-category-form";

type CreateCategoryDialogProps = {
  workspaceId: string;
  transactionTypeId: number;
  transactionTypeName: string;
  categoryCount: number;
};

export function CreateCategoryDialog({
  workspaceId,
  transactionTypeId,
  transactionTypeName,
  categoryCount,
}: CreateCategoryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousCategoryCountRef = useRef(categoryCount);
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (previousCategoryCountRef.current === categoryCount) {
      return;
    }

    previousCategoryCountRef.current = categoryCount;
    dialogRef.current?.close();
  }, [categoryCount]);

  return (
    <>
      <button
        className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Add category
      </button>

      <dialog
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
        onClose={() => setIsOpen(false)}
        ref={dialogRef}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950" id={titleId}>
                Add category
              </h2>

              <p className="mt-1 text-sm text-zinc-600">
                Create a category under <strong>{transactionTypeName}</strong>.
              </p>
            </div>

            <button
              aria-label="Close category dialog"
              className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>

          <div className="mt-5">
            <CreateCategoryForm key={categoryCount} transactionTypeId={transactionTypeId} workspaceId={workspaceId} />
          </div>
        </div>
      </dialog>
    </>
  );
}
