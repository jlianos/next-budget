"use server";

import { cookies } from "next/headers";
import * as v from "valibot";

import { localeCookieName, locales } from "@/i18n/config";

const LocaleSchema = v.picklist(locales);

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function setLocale(formData: FormData) {
  const result = v.safeParse(LocaleSchema, formData.get("locale"));

  if (!result.success) {
    return;
  }

  (await cookies()).set(localeCookieName, result.output, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
}
