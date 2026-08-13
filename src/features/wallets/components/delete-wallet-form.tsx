"use client";

import { useTranslations } from "next-intl";
import { useActionState, useRef } from "react";

import { deleteWallet } from "../actions";
import { initialDeleteWalletFormState } from "../validation";

type DeleteWalletFormProps = {
  workspaceId: string;
  walletId: number;
  walletName: string;
};

export function DeleteWalletForm({ workspaceId, walletId, walletName }: DeleteWalletFormProps) {
  const t = useTranslations("Wallets.forms");
  const dialogRef = useRef<HTMLDialogElement>(null);

  const deleteThisWallet = deleteWallet.bind(null, workspaceId, String(walletId));

  const [state, formAction, pending] = useActionState(deleteThisWallet, initialDeleteWalletFormState);

  const titleId = `delete-wallet-${walletId}-title`;
  const descriptionId = `delete-wallet-${walletId}-description`;

  return (
    <>
      <button
        className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {t("delete")}
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
            {t("deleteTitle")}
          </h2>

          <p className="mt-2 text-sm text-zinc-600" id={descriptionId}>
            {t.rich("deleteDescription", {
              walletName,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
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
              {t("cancel")}
            </button>

            <form action={formAction}>
              <button
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={pending}
                type="submit"
              >
                {pending ? t("deleting") : t("deletePermanently")}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
