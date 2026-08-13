import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import elMessages from "../../messages/el.json";
import enMessages from "../../messages/en.json";

import { defaultLocale, isLocale, localeCookieName } from "./config";

const messages = {
  en: enMessages,
  el: elMessages,
};

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(localeCookieName)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: messages[locale],
    timeZone: "Europe/Athens",
  };
});
