"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormErrors } from "@/components/forms/form-errors";

import { updateTransactionCategory } from "../actions";
import { initialCategoryFormState } from "../validation";

type EditCategoryFormProps = {
  workspaceId: string;
  categoryId: number;
  currentName: string;
  currentDescription: string | null;
};

export function EditCategoryForm({ workspaceId, categoryId, currentName, currentDescription }: EditCategoryFormProps) {
  const t = useTranslations("Categories.forms");
  const updateThisCategory = updateTransactionCategory.bind(null, workspaceId, String(categoryId));

  const [state, formAction, pending] = useActionState(updateThisCategory, initialCategoryFormState);

  const nameErrors = state.fieldErrors?.name;
  const descriptionErrors = state.fieldErrors?.description;

  const nameId = `edit-category-${categoryId}-name`;
  const nameErrorsId = `edit-category-${categoryId}-name-errors`;
  const descriptionId = `edit-category-${categoryId}-description`;
  const descriptionErrorsId = `edit-category-${categoryId}-description-errors`;

  return (
    <details className="mt-4 border-t border-zinc-200 pt-3">
      <summary className="cursor-pointer text-sm font-medium text-zinc-700">{t("editCategory")}</summary>

      <form action={formAction} className="mt-4 space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700" htmlFor={nameId}>
            {t("categoryName")}
          </label>

          <input
            aria-describedby={nameErrors ? nameErrorsId : undefined}
            aria-invalid={Boolean(nameErrors)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            defaultValue={currentName}
            id={nameId}
            maxLength={60}
            minLength={2}
            name="name"
            required
            type="text"
          />

          <FormErrors errors={nameErrors} id={nameErrorsId} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700" htmlFor={descriptionId}>
            {t("description")} <span className="text-zinc-500">({t("optional")})</span>
          </label>

          <textarea
            aria-describedby={descriptionErrors ? descriptionErrorsId : undefined}
            aria-invalid={Boolean(descriptionErrors)}
            className="min-h-20 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            defaultValue={currentDescription ?? ""}
            id={descriptionId}
            maxLength={200}
            name="description"
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
          {pending ? t("saving") : t("saveCategory")}
        </button>
      </form>
    </details>
  );
}
