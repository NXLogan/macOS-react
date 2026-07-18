import { useContext, useEffect } from "react";
import { store } from "../../App";
import { ACCENT_COLORS } from "../../apps/parametres/settingsMeta";
import updateSysColor from "../../utils/helpers/updateSysColor";

/** Applies theme, accent, dock layout, auto-lock from prefs. */
export default function PrefsEffects() {
  const [state, dispatch] = useContext(store);
  const prefs = state.settings?.prefs;

  useEffect(() => {
    if (!prefs) return;
    const root = document.documentElement;
    const page = document.getElementById("page");

    root.classList.remove("theme-light", "theme-dark", "theme-auto");
    root.classList.add(`theme-${prefs.theme}`);

    let dark = prefs.theme === "dark";
    if (prefs.theme === "auto") {
      dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("theme-dark-resolved", dark);
      root.classList.toggle("theme-light-resolved", !dark);
    } else {
      root.classList.remove("theme-dark-resolved", "theme-light-resolved");
    }

    if (page) {
      page.dataset.theme = dark || prefs.theme === "dark" ? "dark" : "light";
    }

    const accent = ACCENT_COLORS[prefs.accent] || ACCENT_COLORS.blue;
    root.style.setProperty("--nxg-accent", accent);
    root.style.setProperty("--user-color", accent);
    updateSysColor(prefs.accent);
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
    shell.classList.add(`dock-pos-${prefs.dockPosition}`);
    shell.setAttribute("data-icon-size", prefs.dockIconSize);
  }, [prefs?.dockPosition, prefs?.dockIconSize]);

  // Auto-lock after inactivity
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
  }, [
    prefs?.autoLockMinutes,
    state.booting,
    state.locked,
    dispatch,
  ]);

  return null;
}
