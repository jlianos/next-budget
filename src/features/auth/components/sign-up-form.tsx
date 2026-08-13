"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormErrors } from "@/components/forms/form-errors";

import { signUp } from "../actions";
import { initialAuthFormState } from "../validation";

export function SignUpForm() {
  const t = useTranslations("Auth.forms");
  const [state, formAction, pending] = useActionState(signUp, initialAuthFormState);

  const emailErrors = state.fieldErrors?.email;
  const passwordErrors = state.fieldErrors?.password;
  const confirmPasswordErrors = state.fieldErrors?.confirmPassword;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          {t("email")}
        </label>

        <input
          aria-describedby={emailErrors ? "email-errors" : undefined}
          aria-invalid={Boolean(emailErrors)}
          autoComplete="email"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id="email"
          name="email"
          required
          type="email"
        />

        <FormErrors errors={emailErrors} id="email-errors" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          {t("password")}
        </label>

        <input
          aria-describedby={passwordErrors ? "password-errors" : undefined}
          aria-invalid={Boolean(passwordErrors)}
          autoComplete="new-password"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id="password"
          minLength={12}
          name="password"
          required
          type="password"
        />

        <FormErrors errors={passwordErrors} id="password-errors" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="confirmPassword">
          {t("confirmPassword")}
        </label>

        <input
          aria-describedby={confirmPasswordErrors ? "confirm-password-errors" : undefined}
          aria-invalid={Boolean(confirmPasswordErrors)}
          autoComplete="new-password"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          id="confirmPassword"
          minLength={12}
          name="confirmPassword"
          required
          type="password"
        />

        <FormErrors errors={confirmPasswordErrors} id="confirm-password-errors" />
      </div>

      {state.formError && (
        <p aria-live="polite" className="text-sm text-red-600" role="alert">
          {state.formError}
        </p>
      )}

      <button
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? t("creatingAccount") : t("createAccount")}
      </button>

      <p className="text-center text-sm text-zinc-600">
        {t("hasAccount")} {" "}
        <Link className="font-medium text-zinc-950 underline" href="/sign-in">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
