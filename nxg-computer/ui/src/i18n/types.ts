export type LocaleCode = "fr" | "en" | "ar" | "ru";

export const LOCALES: { code: LocaleCode; label: string; native: string }[] = [
  { code: "fr", label: "French", native: "Français" },
  { code: "en", label: "English", native: "English" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "ru", label: "Russian", native: "Русский" },
];

export const DEFAULT_LOCALE: LocaleCode = "fr";

export function normalizeLocale(raw?: string | null): LocaleCode {
  const v = (raw || "").toLowerCase().trim();
  if (v === "fr" || v === "en" || v === "ar" || v === "ru") return v;
  if (v.startsWith("fr")) return "fr";
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ar")) return "ar";
  if (v.startsWith("ru")) return "ru";
  return DEFAULT_LOCALE;
}

export function isRtl(locale: LocaleCode): boolean {
  return locale === "ar";
}

/** BCP 47 tag for Intl / dates */
export function localeTag(locale: LocaleCode): string {
  switch (locale) {
    case "en":
      return "en-GB";
    case "ar":
      return "ar";
    case "ru":
      return "ru-RU";
    default:
      return "fr-FR";
  }
}

export type Dict = Record<string, string>;
