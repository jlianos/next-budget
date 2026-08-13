"use client";

import { useLocale, useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";

import { setLocale } from "./actions";

function LocaleSelect() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const { pending } = useFormStatus();

  return (
    <div className="space-y-1.5 px-3 py-2">
      <label className="block text-xs font-medium text-zinc-500" htmlFor="application-locale">
        {t("language")}
      </label>

      <select
        className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60"
        disabled={pending}
        id="application-locale"
        name="locale"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        value={locale}
      >
        <option value="en">{t("english")}</option>
        <option value="el">{t("greek")}</option>
      </select>
    </div>
  );
}

export function LocaleSwitcher() {
  return (
    <form action={setLocale}>
      <LocaleSelect />
    </form>
  );
}
