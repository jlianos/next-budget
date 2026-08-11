import type { Metadata } from "next";

import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your expense tracker.",
};

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-zinc-500">Next Budget</p>

        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>

        <p className="text-sm text-zinc-600">Sign in to continue managing your finances.</p>
      </header>

      <SignInForm />
    </div>
  );
}
