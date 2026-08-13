"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormErrors } from "@/components/forms/form-errors";

import { updateWallet } from "../actions";
import { initialWalletFormState } from "../validation";

type RenameWalletFormProps = {
  workspaceId: string;
  walletId: number;
  currentName: string;
};

export function RenameWalletForm({ workspaceId, walletId, currentName }: RenameWalletFormProps) {
  const t = useTranslations("Wallets.forms");
  const updateThisWallet = updateWallet.bind(null, workspaceId, String(walletId));

  const [state, formAction, pending] = useActionState(updateThisWallet, initialWalletFormState);

  const nameErrors = state.fieldErrors?.name;
  const inputId = `wallet-${walletId}-name`;
  const errorsId = `wallet-${walletId}-name-errors`;

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor={inputId}>
          {t("name")}
        </label>

        <input
          aria-describedby={nameErrors ? errorsId : undefined}
          aria-invalid={Boolean(nameErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          defaultValue={currentName}
          id={inputId}
          maxLength={60}
          minLength={2}
          name="name"
          required
          type="text"
        />

        <FormErrors errors={nameErrors} id={errorsId} />
      </div>

      {state.formError && (
        <p aria-live="polite" className="text-sm text-red-600" role="alert">
          {state.formError}
        </p>
      )}

      {state.successMessage && (
        <p aria-live="polite" className="text-sm text-green-700">
          {state.successMessage}
        </p>
      )}

      <button
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? t("saving") : t("rename")}
      </button>
    </form>
  );
}
