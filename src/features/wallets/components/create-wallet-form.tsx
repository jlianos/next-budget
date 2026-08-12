"use client";

import { useActionState, useEffect, useRef } from "react";

import { FormErrors } from "@/components/forms/form-errors";

import { createWallet } from "../actions";
import { initialWalletFormState } from "../validation";

type CreateWalletFormProps = {
  workspaceId: string;
};

export function CreateWalletForm({ workspaceId }: CreateWalletFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const createThisWallet = createWallet.bind(null, workspaceId);

  const [state, formAction, pending] = useActionState(createThisWallet, initialWalletFormState);

  const nameErrors = state.fieldErrors?.name;

  useEffect(() => {
    if (state.successMessage) {
      formRef.current?.reset();
    }
  }, [state.successMessage]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="walletName">
          Wallet name
        </label>

        <input
          aria-describedby={nameErrors ? "wallet-name-errors" : undefined}
          aria-invalid={Boolean(nameErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id="walletName"
          maxLength={60}
          minLength={2}
          name="name"
          placeholder="Main account"
          required
          type="text"
        />

        <FormErrors errors={nameErrors} id="wallet-name-errors" />
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
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating wallet…" : "Create wallet"}
      </button>
    </form>
  );
}
