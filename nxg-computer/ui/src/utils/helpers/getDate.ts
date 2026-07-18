import { getLocale, localeTag, normalizeLocale } from "../../i18n";

/** Localized date + time for menubar / lock screen */
const getDate = (language?: string) => {
  const locale = normalizeLocale(language || getLocale());
  const tag = localeTag(locale);
  const now = new Date();

  const dateOutput = new Intl.DateTimeFormat(tag, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);

  const timeOutput = new Intl.DateTimeFormat(tag, {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  return [dateOutput, timeOutput] as [string, string];
};

export default getDate;
