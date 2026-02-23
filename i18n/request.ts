import {getRequestConfig} from "next-intl/server";
import {hasLocale} from "next-intl";

import {routing} from "@/i18n/routing";

type MessageValue = string | number | boolean | null | MessageTree | MessageValue[];
type MessageTree = {[key: string]: MessageValue};

const isMessageTree = (value: MessageValue): value is MessageTree =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const mergeMessages = (base: MessageTree, localized: MessageTree): MessageTree => {
  const result: MessageTree = {...base};

  for (const [key, value] of Object.entries(localized)) {
    const baseValue = result[key];
    if (isMessageTree(baseValue) && isMessageTree(value)) {
      result[key] = mergeMessages(baseValue, value);
      continue;
    }

    result[key] = value;
  }

  return result;
};

const loadMessages = async (locale: string): Promise<MessageTree> => {
  const localeBundle = (await import(`../messages/${locale}.json`).catch(() =>
    import("../messages/de.json"),
  )) as { default: MessageTree };

  return localeBundle.default;
};

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const baseMessages = await loadMessages(routing.defaultLocale);
  const localizedMessages = await loadMessages(locale);

  return {
    locale,
    messages: mergeMessages(baseMessages, localizedMessages),
  };
});
