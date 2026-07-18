import { useContext, useMemo } from "react";
import { store } from "../App";
import { getLocale, normalizeLocale, setLocale, t as translate } from "./index";
import type { LocaleCode } from "./types";

/** Hook: translate with live prefs.language */
export function useT() {
  const [state] = useContext(store);
  const locale = normalizeLocale(state?.settings?.prefs?.language);

  return useMemo(() => {
    setLocale(locale);
    return (key: string, vars?: Record<string, string | number>) =>
      translate(key, vars, locale);
  }, [locale]);
}

export function useLocale(): LocaleCode {
  const [state] = useContext(store);
  return normalizeLocale(state?.settings?.prefs?.language);
}

/** Non-hook translate using last set locale (or pass lang from state) */
export function tFor(
  language: string | undefined,
  key: string,
  vars?: Record<string, string | number>
) {
  return translate(key, vars, normalizeLocale(language));
}

export { getLocale, setLocale };
