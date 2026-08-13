"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";

import { FormErrors } from "@/components/forms/form-errors";

import { createTransaction, updateTransaction } from "../actions";
import { initialTransactionFormState } from "../validation";

type TransactionTypeOption = {
  id: number;
  name: string;
  direction: "INCOME" | "EXPENSE";
  transactionCategories: {
    id: number;
    name: string;
  }[];
};

type TransactionFormProps = {
  workspaceId: string;
  currency: string;
  defaultOccurredAt: string;
  wallets: {
    id: number;
    name: string;
  }[];
  transactionTypes: TransactionTypeOption[];
  transaction?: {
    id: number;
    amount: string;
    walletId: number;
    categoryId: number;
    occurredAt: string;
  };
  onCreated?: () => void;
};
export function TransactionForm({
  workspaceId,
  currency,
  defaultOccurredAt,
  wallets,
  transactionTypes,
  transaction,
  onCreated,
}: TransactionFormProps) {
  const t = useTranslations("Transactions.forms");
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const ids = {
    amount: `${formId}-amount`,
    amountErrors: `${formId}-amount-errors`,
    wallet: `${formId}-wallet`,
    walletErrors: `${formId}-wallet-errors`,
    category: `${formId}-category`,
    categoryErrors: `${formId}-category-errors`,
    occurredAt: `${formId}-occurred-at`,
    occurredAtErrors: `${formId}-occurred-at-errors`,
  };

  const transactionAction = transaction
    ? updateTransaction.bind(null, workspaceId, transaction.id.toString())
    : createTransaction.bind(null, workspaceId);

  const [state, formAction, pending] = useActionState(transactionAction, initialTransactionFormState);
  useEffect(() => {
    if (!transaction && state.successMessage && onCreated) {
      formRef.current?.reset();
      onCreated();
    }
  }, [onCreated, state.successMessage, transaction]);

  const amountErrors = state.fieldErrors?.amount;
  const walletErrors = state.fieldErrors?.walletId;
  const categoryErrors = state.fieldErrors?.categoryId;
  const dateErrors = state.fieldErrors?.occurredAt;

  const hasCategories = transactionTypes.some((type) => type.transactionCategories.length > 0);

  const formAvailable = wallets.length > 0 && hasCategories;

  return (
    <form action={formAction} className="space-y-5" ref={formRef}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={ids.amount}>
          {t("amount", { currency })}
        </label>

        <input
          aria-describedby={amountErrors ? ids.amountErrors : undefined}
          aria-invalid={Boolean(amountErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id={ids.amount}
          inputMode="decimal"
          max="999999999999.99"
          min="0.01"
          name="amount"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
          defaultValue={transaction?.amount}
        />

        <FormErrors errors={amountErrors} id={ids.amountErrors} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={ids.wallet}>
          {t("wallet")}
        </label>

        <select
          aria-describedby={walletErrors ? ids.walletErrors : undefined}
          aria-invalid={Boolean(walletErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          defaultValue={transaction?.walletId.toString() ?? ""}
          id={ids.wallet}
          name="walletId"
          required
        >
          <option disabled value="">
            {t("selectWallet")}
          </option>

          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>

        <FormErrors errors={walletErrors} id={ids.walletErrors} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={ids.category}>
          {t("category")}
        </label>

        <select
          aria-describedby={categoryErrors ? ids.categoryErrors : undefined}
          aria-invalid={Boolean(categoryErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          defaultValue={transaction?.categoryId.toString() ?? ""}
          id={ids.category}
          name="categoryId"
          required
        >
          <option disabled value="">
            {t("selectCategory")}
          </option>

          {transactionTypes.map((type) => (
            <optgroup key={type.id} label={`${t(type.direction === "INCOME" ? "income" : "expense")} · ${type.name}`}>
              {type.transactionCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <FormErrors errors={categoryErrors} id={ids.categoryErrors} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={ids.occurredAt}>
          {t("dateTime")}
        </label>

        <input
          aria-describedby={dateErrors ? ids.occurredAtErrors : undefined}
          aria-invalid={Boolean(dateErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          defaultValue={transaction?.occurredAt ?? defaultOccurredAt}
          id={ids.occurredAt}
          name="occurredAt"
          required
          type="datetime-local"
          step={60}
        />

        <FormErrors errors={dateErrors} id={ids.occurredAtErrors} />
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
          ? transaction
            ? t("updating")
            : t("saving")
          : transaction
            ? t("update")
            : t("save")}
      </button>
    </form>
  );
}
