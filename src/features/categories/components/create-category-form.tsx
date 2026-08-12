"use client";

import { useActionState, useEffect, useRef } from "react";

import { FormErrors } from "@/components/forms/form-errors";

import { createTransactionCategory } from "../actions";
import { initialCategoryFormState } from "../validation";

type CreateCategoryFormProps = {
  workspaceId: string;
  transactionTypeId: number;
};

export function CreateCategoryForm({ workspaceId, transactionTypeId }: CreateCategoryFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const createThisCategory = createTransactionCategory.bind(null, workspaceId, String(transactionTypeId));

  const [state, formAction, pending] = useActionState(createThisCategory, initialCategoryFormState);

  const nameErrors = state.fieldErrors?.name;
  const descriptionErrors = state.fieldErrors?.description;

  const nameId = `category-${transactionTypeId}-name`;
  const nameErrorsId = `category-${transactionTypeId}-name-errors`;
  const descriptionId = `category-${transactionTypeId}-description`;
  const descriptionErrorsId = `category-${transactionTypeId}-description-errors`;

  useEffect(() => {
    if (state.successMessage) {
      formRef.current?.reset();
    }
  }, [state.successMessage]);

  return (
    <form action={formAction} className="space-y-3" ref={formRef}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor={nameId}>
          Category name
        </label>

        <input
          aria-describedby={nameErrors ? nameErrorsId : undefined}
          aria-invalid={Boolean(nameErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id={nameId}
          maxLength={60}
          minLength={2}
          name="name"
          placeholder="Groceries"
          required
          type="text"
        />

        <FormErrors errors={nameErrors} id={nameErrorsId} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor={descriptionId}>
          Description <span className="text-zinc-500">(optional)</span>
        </label>

        <textarea
          aria-describedby={descriptionErrors ? descriptionErrorsId : undefined}
          aria-invalid={Boolean(descriptionErrors)}
          className="min-h-20 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id={descriptionId}
          maxLength={200}
          name="description"
          placeholder="Everyday food and supermarket purchases"
        />

        <FormErrors errors={descriptionErrors} id={descriptionErrorsId} />
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
        {pending ? "Creating category…" : "Add category"}
      </button>
    </form>
  );
}
