"use client";

import { useActionState } from "react";

import { FormErrors } from "@/components/forms/form-errors";

import { createRecurringTransaction } from "../actions";
import { initialRecurringTransactionFormState } from "../validation";

type TransactionTypeOption = {
  id: number;
  name: string;
  direction: "INCOME" | "EXPENSE";
  transactionCategories: {
    id: number;
    name: string;
  }[];
};

type CreateRecurringTransactionFormProps = {
  workspaceId: string;
  currency: string;
  defaultStartsAt: string;
  wallets: {
    id: number;
    name: string;
  }[];
  transactionTypes: TransactionTypeOption[];
};

export function CreateRecurringTransactionForm({
  workspaceId,
  currency,
  defaultStartsAt,
  wallets,
  transactionTypes,
}: CreateRecurringTransactionFormProps) {
  const action = createRecurringTransaction.bind(null, workspaceId);

  const [state, formAction, pending] = useActionState(action, initialRecurringTransactionFormState);

  const amountErrors = state.fieldErrors?.amount;
  const walletErrors = state.fieldErrors?.walletId;
  const categoryErrors = state.fieldErrors?.categoryId;
  const frequencyErrors = state.fieldErrors?.frequency;
  const intervalErrors = state.fieldErrors?.interval;
  const startsAtErrors = state.fieldErrors?.startsAt;
  const endsAtErrors = state.fieldErrors?.endsAt;

  const hasCategories = transactionTypes.some((type) => type.transactionCategories.length > 0);

  const formAvailable = wallets.length > 0 && hasCategories;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="recurringAmount">
          Amount ({currency})
        </label>

        <input
          aria-describedby={amountErrors ? "recurring-amount-errors" : undefined}
          aria-invalid={Boolean(amountErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id="recurringAmount"
          inputMode="decimal"
          max="999999999999.99"
          min="0.01"
          name="amount"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />

        <FormErrors errors={amountErrors} id="recurring-amount-errors" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recurringWallet">
            Wallet
          </label>

          <select
            aria-describedby={walletErrors ? "recurring-wallet-errors" : undefined}
            aria-invalid={Boolean(walletErrors)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            defaultValue=""
            id="recurringWallet"
            name="walletId"
            required
          >
            <option disabled value="">
              Select a wallet
            </option>

            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>

          <FormErrors errors={walletErrors} id="recurring-wallet-errors" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recurringCategory">
            Category
          </label>

          <select
            aria-describedby={categoryErrors ? "recurring-category-errors" : undefined}
            aria-invalid={Boolean(categoryErrors)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            defaultValue=""
            id="recurringCategory"
            name="categoryId"
            required
          >
            <option disabled value="">
              Select a category
            </option>

            {transactionTypes.map((type) => (
              <optgroup key={type.id} label={`${type.direction === "INCOME" ? "Income" : "Expense"} · ${type.name}`}>
                {type.transactionCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <FormErrors errors={categoryErrors} id="recurring-category-errors" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recurringFrequency">
            Frequency
          </label>

          <select
            aria-describedby={frequencyErrors ? "recurring-frequency-errors" : undefined}
            aria-invalid={Boolean(frequencyErrors)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            defaultValue="MONTHLY"
            id="recurringFrequency"
            name="frequency"
            required
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>

          <FormErrors errors={frequencyErrors} id="recurring-frequency-errors" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recurringInterval">
            Repeat every
          </label>

          <input
            aria-describedby={intervalErrors ? "recurring-interval-errors" : undefined}
            aria-invalid={Boolean(intervalErrors)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            defaultValue="1"
            id="recurringInterval"
            inputMode="numeric"
            min="1"
            name="interval"
            required
            step="1"
            type="number"
          />

          <FormErrors errors={intervalErrors} id="recurring-interval-errors" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recurringStartsAt">
            Starts
          </label>

          <input
            aria-describedby={startsAtErrors ? "recurring-start-errors" : undefined}
            aria-invalid={Boolean(startsAtErrors)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            defaultValue={defaultStartsAt}
            id="recurringStartsAt"
            name="startsAt"
            required
            step={60}
            type="datetime-local"
          />

          <FormErrors errors={startsAtErrors} id="recurring-start-errors" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recurringEndsAt">
            Ends
            <span className="ml-1 font-normal text-zinc-500">(optional)</span>
          </label>

          <input
            aria-describedby={endsAtErrors ? "recurring-end-errors" : undefined}
            aria-invalid={Boolean(endsAtErrors)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            id="recurringEndsAt"
            name="endsAt"
            step={60}
            type="datetime-local"
          />

          <FormErrors errors={endsAtErrors} id="recurring-end-errors" />
        </div>
      </div>

      {!formAvailable && (
        <p className="text-sm text-amber-700">
          This workspace needs at least one wallet and category before you can create a recurring schedule.
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
        {pending ? "Creating schedule…" : "Create schedule"}
      </button>
    </form>
  );
}
