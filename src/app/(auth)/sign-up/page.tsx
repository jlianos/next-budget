import type { Metadata } from "next";

import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your expense tracker account.",
};

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-zinc-500">Next Budget</p>

        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>

        <p className="text-sm text-zinc-600">Start tracking your finances or join an existing workspace.</p>
      </header>

      <SignUpForm />
    </div>
  );
}
