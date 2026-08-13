"use client";

import { useActionState, useId } from "react";

import { FormErrors } from "@/components/forms/form-errors";

import { renameWorkspace } from "../actions";
import { initialRenameWorkspaceState } from "../validation";

type RenameWorkspaceFormProps = {
  workspaceId: string;
  defaultName: string;
};

export function RenameWorkspaceForm({ workspaceId, defaultName }: RenameWorkspaceFormProps) {
  const nameId = useId();
  const nameErrorsId = `${nameId}-errors`;

  const renameThisWorkspace = renameWorkspace.bind(null, workspaceId);

  const [state, formAction, pending] = useActionState(renameThisWorkspace, initialRenameWorkspaceState);

  const nameErrors = state.fieldErrors?.name;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={nameId}>
          Workspace name
        </label>

        <input
          aria-describedby={nameErrors ? nameErrorsId : undefined}
          aria-invalid={Boolean(nameErrors)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          defaultValue={defaultName}
          id={nameId}
          maxLength={60}
          minLength={2}
          name="name"
          required
          type="text"
        />

        <FormErrors errors={nameErrors} id={nameErrorsId} />
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
        {pending ? "Renaming workspace…" : "Rename workspace"}
      </button>
    </form>
  );
}
