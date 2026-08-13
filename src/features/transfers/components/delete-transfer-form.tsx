"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { deleteTransfer } from "../actions";
import { initialDeleteTransferState } from "../validation";

type DeleteTransferFormProps = {
  workspaceId: string;
  transferId: number;
};

export function DeleteTransferForm({ workspaceId, transferId }: DeleteTransferFormProps) {
  const t = useTranslations("Transfers.delete");
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
        {t("button")}
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <p className="font-medium text-red-800">{t("title")}</p>

        <p className="mt-1 text-sm text-red-700">{t("description")}</p>
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
          {pending ? t("deleting") : t("confirm")}
        </button>

        <button
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          disabled={pending}
          onClick={() => setConfirming(false)}
          type="button"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
