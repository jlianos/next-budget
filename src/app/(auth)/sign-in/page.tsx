import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SignInForm } from "@/features/auth/components/sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.signIn");

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function SignInPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-zinc-500">{t("brand")}</p>

        <h1 className="text-2xl font-semibold tracking-tight">{t("signIn.title")}</h1>

        <p className="text-sm text-zinc-600">{t("signIn.description")}</p>
      </header>

      <SignInForm />
    </div>
  );
}
