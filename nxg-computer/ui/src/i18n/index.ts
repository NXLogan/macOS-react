import { DEFAULT_LOCALE, Dict, LocaleCode, localeTag, normalizeLocale, isRtl } from "./types";
import fr from "./locales/fr";
import en from "./locales/en";
import ar from "./locales/ar";
import ru from "./locales/ru";

const TABLES: Record<LocaleCode, Dict> = { fr, en, ar, ru };

let currentLocale: LocaleCode = DEFAULT_LOCALE;

export function setLocale(locale: string | null | undefined) {
  currentLocale = normalizeLocale(locale);
  return currentLocale;
}

export function getLocale(): LocaleCode {
  return currentLocale;
}

export function t(
  key: string,
  vars?: Record<string, string | number>,
  locale?: LocaleCode
): string {
  const lang = locale || currentLocale;
  const table = TABLES[lang] || TABLES.fr;
  let str = table[key] ?? TABLES.fr[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

export function appName(id: string, locale?: LocaleCode): string {
  return t(`apps.${id}.name`, undefined, locale);
}

export function appBlurb(id: string, locale?: LocaleCode): string {
  return t(`apps.${id}.blurb`, undefined, locale);
}

export { LOCALES, normalizeLocale, isRtl, localeTag, DEFAULT_LOCALE } from "./types";
export type { LocaleCode, Dict } from "./types";

