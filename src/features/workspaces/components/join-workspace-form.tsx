"use client";

import { useActionState } from "react";

import { FormErrors } from "@/components/forms/form-errors";

import { joinWorkspace } from "../actions";
import { initialJoinWorkspaceFormState } from "../validation";

export function JoinWorkspaceForm() {
  const [state, formAction, pending] = useActionState(joinWorkspace, initialJoinWorkspaceFormState);

  const workspaceIdErrors = state.fieldErrors?.workspaceId;

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="workspaceId">
          Workspace ID
        </label>

        <input
          aria-describedby={workspaceIdErrors ? "workspace-id-errors" : undefined}
          aria-invalid={Boolean(workspaceIdErrors)}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id="workspaceId"
          maxLength={100}
          name="workspaceId"
          placeholder="Paste the workspace ID"
          required
          spellCheck={false}
          type="text"
        />

        <FormErrors errors={workspaceIdErrors} id="workspace-id-errors" />
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
        {pending ? "Joining workspace…" : "Join workspace"}
      </button>
    </form>
  );
}
