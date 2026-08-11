"use client";

import { useActionState } from "react";

import { FormErrors } from "@/components/forms/form-errors";

import { createWorkspace } from "../actions";
import { initialWorkspaceFormState } from "../validation";

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(createWorkspace, initialWorkspaceFormState);

  const nameErrors = state.fieldErrors?.name;
  const currencyErrors = state.fieldErrors?.currency;

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="workspaceName">
          Workspace name
        </label>

        <input
          aria-describedby={nameErrors ? "workspace-name-errors" : undefined}
          aria-invalid={Boolean(nameErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id="workspaceName"
          maxLength={60}
          minLength={2}
          name="name"
          placeholder="Household"
          required
          type="text"
        />

        <FormErrors errors={nameErrors} id="workspace-name-errors" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="workspaceCurrency">
          Currency
        </label>

        <select
          aria-describedby={currencyErrors ? "workspace-currency-errors" : undefined}
          aria-invalid={Boolean(currencyErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          defaultValue="EUR"
          id="workspaceCurrency"
          name="currency"
          required
        >
          <option value="EUR">Euro (EUR)</option>
          <option value="USD">US dollar (USD)</option>
        </select>

        <FormErrors errors={currencyErrors} id="workspace-currency-errors" />
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
        {pending ? "Creating workspace…" : "Create workspace"}
      </button>
    </form>
  );
}
