export const locales = ["en", "el"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "nextbudget-locale";

export function isLocale(value: string | undefined): value is Locale {
  return locales.some((locale) => locale === value);
}
