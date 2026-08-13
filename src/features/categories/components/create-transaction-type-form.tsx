"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";

import { FormErrors } from "@/components/forms/form-errors";

import { createTransactionType } from "../actions";
import { initialTransactionTypeFormState } from "../validation";

type CreateTransactionTypeFormProps = {
  workspaceId: string;
};

export function CreateTransactionTypeForm({ workspaceId }: CreateTransactionTypeFormProps) {
  const t = useTranslations("Categories.forms");
  const formRef = useRef<HTMLFormElement>(null);

  const createThisTransactionType = createTransactionType.bind(null, workspaceId);

  const [state, formAction, pending] = useActionState(createThisTransactionType, initialTransactionTypeFormState);

  const nameErrors = state.fieldErrors?.name;
  const directionErrors = state.fieldErrors?.direction;

  useEffect(() => {
    if (state.successMessage) {
      formRef.current?.reset();
    }
  }, [state.successMessage]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="transactionTypeName">
          {t("typeName")}
        </label>

        <input
          aria-describedby={nameErrors ? "transaction-type-name-errors" : undefined}
          aria-invalid={Boolean(nameErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id="transactionTypeName"
          maxLength={60}
          minLength={2}
          name="name"
          placeholder={t("typePlaceholder")}
          required
          type="text"
        />

        <FormErrors errors={nameErrors} id="transaction-type-name-errors" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="transactionTypeDirection">
          {t("direction")}
        </label>

        <select
          aria-describedby={directionErrors ? "transaction-type-direction-errors" : undefined}
          aria-invalid={Boolean(directionErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          defaultValue=""
          id="transactionTypeDirection"
          name="direction"
          required
        >
          <option disabled value="">
            {t("selectDirection")}
          </option>
          <option value="INCOME">{t("income")}</option>
          <option value="EXPENSE">{t("expense")}</option>
        </select>

        <FormErrors errors={directionErrors} id="transaction-type-direction-errors" />
      </div>

      <p className="text-xs text-zinc-500">{t("directionHint")}</p>

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
        {pending ? t("creatingType") : t("createType")}
      </button>
    </form>
  );
}
