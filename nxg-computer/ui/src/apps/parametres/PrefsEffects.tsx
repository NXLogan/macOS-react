import { useContext, useEffect } from "react";
import { store } from "../../App";
import { ACCENT_COLORS, AccentId } from "./settingsMeta";
import updateSysColor from "../../utils/helpers/updateSysColor";

function resolveDark(theme: string): boolean {
  if (theme === "light") return false;
  if (theme === "dark") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyThemeClass(theme: string) {
  const root = document.documentElement;
  const page = document.getElementById("page");
  const dark = resolveDark(theme);

  root.classList.remove(
    "theme-light",
    "theme-dark",
    "theme-auto",
    "theme-dark-resolved",
    "theme-light-resolved",
    "nxg-theme-light",
    "nxg-theme-dark"
  );
  root.classList.add(`theme-${theme}`);
  root.classList.add(dark ? "nxg-theme-dark" : "nxg-theme-light");
  if (theme === "auto") {
    root.classList.add(dark ? "theme-dark-resolved" : "theme-light-resolved");
  }

  if (page) {
    page.dataset.theme = dark ? "dark" : "light";
  }

  root.dataset.theme = dark ? "dark" : "light";
}

/** Applies theme, accent, dock layout, auto-lock from prefs. */
export default function PrefsEffects() {
  const [state, dispatch] = useContext(store);
  const prefs = state.settings?.prefs;

  useEffect(() => {
    if (!prefs) return;
    applyThemeClass(prefs.theme || "dark");

    const accentId = (prefs.accent || "blue") as AccentId;
    const accent = ACCENT_COLORS[accentId] || ACCENT_COLORS.blue;
    document.documentElement.style.setProperty("--nxg-accent", accent);
    document.documentElement.style.setProperty("--user-color", accent);
    updateSysColor(accentId);

    if (prefs.theme !== "auto") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeClass("auto");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [prefs?.theme, prefs?.accent]);

  useEffect(() => {
    if (!prefs) return;
    const shell = document.querySelector(".dock-shell");
    if (!shell) return;
    shell.classList.remove(
      "dock-pos-bottom",
      "dock-pos-left",
      "dock-pos-right",
      "dock-pos-hidden"
    );
    shell.classList.add(`dock-pos-${prefs.dockPosition || "bottom"}`);
    shell.setAttribute("data-icon-size", prefs.dockIconSize || "medium");
  }, [prefs?.dockPosition, prefs?.dockIconSize, state.session?.ready]);

  useEffect(() => {
    if (!prefs || state.booting || state.locked) return;
    const minutes = prefs.autoLockMinutes;
    if (!minutes || minutes <= 0) return;

    let timer: number | null = null;
    const arm = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        dispatch({ type: "auth/LOCK" });
      }, minutes * 60 * 1000);
    };

    const events = ["pointerdown", "keydown", "mousemove"] as const;
    events.forEach((ev) => window.addEventListener(ev, arm, { passive: true }));
    arm();

    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, arm));
    };
  }, [prefs?.autoLockMinutes, state.booting, state.locked, dispatch]);

  return null;
}
