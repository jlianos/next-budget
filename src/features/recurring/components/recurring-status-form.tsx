"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { startRecurringTransaction, stopRecurringTransaction } from "../actions";
import { initialRecurringStatusState } from "../validation";

type RecurringStatusFormProps = {
  workspaceId: string;
  recurringTransactionId: number;
  isActive: boolean;
};

export function RecurringStatusForm({ workspaceId, recurringTransactionId, isActive }: RecurringStatusFormProps) {
  const t = useTranslations("Recurring.status");
  const statusAction = isActive
    ? stopRecurringTransaction.bind(null, workspaceId, recurringTransactionId.toString())
    : startRecurringTransaction.bind(null, workspaceId, recurringTransactionId.toString());

  const [state, formAction, pending] = useActionState(statusAction, initialRecurringStatusState);

  return (
    <form action={formAction} className="space-y-2">
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
        className={
          isActive
            ? "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            : "rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        }
        disabled={pending}
        type="submit"
      >
        {pending ? (isActive ? t("stopping") : t("starting")) : isActive ? t("stop") : t("start")}
      </button>
    </form>
  );
}
