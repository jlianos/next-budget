"use client";

import { useCallback, useRef, useState } from "react";

import { formatDateTimeInput } from "@/lib/dates";

import { TransactionForm } from "./transaction-form";

type TransactionTypeOption = {
  id: number;
  name: string;
  direction: "INCOME" | "EXPENSE";
  transactionCategories: {
    id: number;
    name: string;
  }[];
};

type QuickAddTransactionDialogProps = {
  workspaceId: string;
  currency: string;
  initialOccurredAt: string;
  wallets: {
    id: number;
    name: string;
  }[];
  transactionTypes: TransactionTypeOption[];
};

export function QuickAddTransactionDialog({
  workspaceId,
  currency,
  initialOccurredAt,
  wallets,
  transactionTypes,
}: QuickAddTransactionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [formKey, setFormKey] = useState(0);
  const [defaultOccurredAt, setDefaultOccurredAt] = useState(initialOccurredAt);

  function openDialog() {
    setDefaultOccurredAt(formatDateTimeInput());
    setFormKey((current) => current + 1);
    dialogRef.current?.showModal();
  }

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label="Add transaction"
        className="fixed right-4 top-3 z-30 flex size-11 items-center justify-center rounded-full bg-zinc-900 text-2xl font-light leading-none text-white shadow-lg transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 md:right-8 md:top-6"
        onClick={openDialog}
        title="Add transaction"
        type="button"
      >
        <span aria-hidden="true">+</span>
      </button>

      <dialog
        aria-labelledby="quick-add-transaction-title"
        className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
        ref={dialogRef}
      >
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950" id="quick-add-transaction-title">
                Add transaction
              </h2>

              <p className="mt-1 text-sm text-zinc-600">Quickly record income or an expense.</p>
            </div>

            <button
              aria-label="Close add transaction dialog"
              className="rounded-lg p-2 text-xl leading-none text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
              onClick={closeDialog}
              type="button"
            >
              ×
            </button>
          </div>

          <TransactionForm
            currency={currency}
            defaultOccurredAt={defaultOccurredAt}
            key={formKey}
            onCreated={closeDialog}
            transactionTypes={transactionTypes}
            wallets={wallets}
            workspaceId={workspaceId}
          />
        </div>
      </dialog>
    </>
  );
}
