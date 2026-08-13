import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTimeZone, getTranslations } from "next-intl/server";

import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#065f46",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");

  return {
    title: t("title"),
    description: t("description"),
    applicationName: "NextBudget",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "NextBudget",
    },
    icons: {
      apple: "/apple-touch-icon.png",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, messages, timeZone] = await Promise.all([getLocale(), getMessages(), getTimeZone()]);

  return (
    <html className="h-full antialiased" lang={locale}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider key={locale} locale={locale} messages={messages} timeZone={timeZone}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
