"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { RenameTransactionTypeForm } from "./rename-transaction-type";

type RenameTransactionTypeDialogProps = {
  workspaceId: string;
  transactionTypeId: number;
  currentName: string;
};

export function RenameTransactionTypeDialog({
  workspaceId,
  transactionTypeId,
  currentName,
}: RenameTransactionTypeDialogProps) {
  const t = useTranslations("Categories.forms");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const previousNameRef = useRef(currentName);

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
    if (previousNameRef.current === currentName) {
      return;
    }

    previousNameRef.current = currentName;
    dialogRef.current?.close();
  }, [currentName]);

  return (
    <>
      <button
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {t("renameType")}
      </button>

      <dialog
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
        onClose={() => setIsOpen(false)}
        ref={dialogRef}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-950" id={titleId}>
              {t("renameTypeTitle")}
            </h2>

            <button
              aria-label={t("closeRenameDialog")}
              className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>

          <p className="mt-2 text-sm text-zinc-600">
            {t.rich("renameTypeDescription", {
              typeName: currentName,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>

          <div className="mt-5">
            <RenameTransactionTypeForm
              currentName={currentName}
              transactionTypeId={transactionTypeId}
              workspaceId={workspaceId}
            />
          </div>
        </div>
      </dialog>
    </>
  );
}
