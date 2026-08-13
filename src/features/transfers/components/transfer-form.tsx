"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { FormErrors } from "@/components/forms/form-errors";

import { createTransfer, updateTransfer } from "../actions";
import { initialTransferFormState } from "../validation";

type WalletOption = {
  id: number;
  name: string;
};

type TransferFormProps = {
  workspaceId: string;
  currency: string;
  defaultOccurredAt: string;
  wallets: WalletOption[];
  transfer?: {
    id: number;
    amount: string;
    fromWalletId: number;
    toWalletId: number;
    occurredAt: string;
  };
};

export function TransferForm({ workspaceId, currency, defaultOccurredAt, wallets, transfer }: TransferFormProps) {
  const t = useTranslations("Transfers.forms");
  const transferAction = transfer
    ? updateTransfer.bind(null, workspaceId, transfer.id.toString())
    : createTransfer.bind(null, workspaceId);

  const [state, formAction, pending] = useActionState(transferAction, initialTransferFormState);

  const amountErrors = state.fieldErrors?.amount;
  const fromWalletErrors = state.fieldErrors?.fromWalletId;
  const toWalletErrors = state.fieldErrors?.toWalletId;
  const dateErrors = state.fieldErrors?.occurredAt;

  const formAvailable = wallets.length >= 2;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="transferAmount">
          {t("amount", { currency })}
        </label>

        <input
          aria-describedby={amountErrors ? "transfer-amount-errors" : undefined}
          aria-invalid={Boolean(amountErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id="transferAmount"
          inputMode="decimal"
          max="999999999999.99"
          min="0.01"
          name="amount"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
          defaultValue={transfer?.amount}
        />

        <FormErrors errors={amountErrors} id="transfer-amount-errors" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="transferFromWallet">
          {t("fromWallet")}
        </label>

        <select
          aria-describedby={fromWalletErrors ? "transfer-from-wallet-errors" : undefined}
          aria-invalid={Boolean(fromWalletErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          defaultValue={transfer?.fromWalletId.toString() ?? ""}
          id="transferFromWallet"
          name="fromWalletId"
          required
        >
          <option disabled value="">
            {t("selectSource")}
          </option>

          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>

        <FormErrors errors={fromWalletErrors} id="transfer-from-wallet-errors" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="transferToWallet">
          {t("toWallet")}
        </label>

        <select
          aria-describedby={toWalletErrors ? "transfer-to-wallet-errors" : undefined}
          aria-invalid={Boolean(toWalletErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          defaultValue={transfer?.toWalletId.toString() ?? ""}
          id="transferToWallet"
          name="toWalletId"
          required
        >
          <option disabled value="">
            {t("selectDestination")}
          </option>

          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>

        <FormErrors errors={toWalletErrors} id="transfer-to-wallet-errors" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="transferDateTime">
          {t("dateTime")}
        </label>

        <input
          aria-describedby={dateErrors ? "transfer-date-errors" : undefined}
          aria-invalid={Boolean(dateErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          defaultValue={transfer?.occurredAt ?? defaultOccurredAt}
          id="transferDateTime"
          name="occurredAt"
          required
          step={60}
          type="datetime-local"
        />

        <FormErrors errors={dateErrors} id="transfer-date-errors" />
      </div>

      {!formAvailable && (
        <p className="text-sm text-amber-700">
          {t("unavailable")}
        </p>
      )}

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
        disabled={pending || !formAvailable}
        type="submit"
      >
        {pending
          ? transfer
            ? t("updating")
            : t("saving")
          : transfer
            ? t("update")
            : t("save")}
      </button>
    </form>
  );
}
