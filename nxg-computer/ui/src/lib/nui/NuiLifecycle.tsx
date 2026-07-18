import { useContext, useEffect, useRef } from "react";
import { store } from "../../App";
import { fetchNui, isEnvBrowser, onNuiEvent } from "./fetchNui";

/**
 * FiveM NUI lifecycle: hide until open, Escape closes, ready handshake.
 * In browser/dev the UI stays visible.
 */
export default function NuiLifecycle() {
  const [state, dispatch] = useContext(store);
  const stateRef = useRef(state);
  stateRef.current = state;
  const visibleRef = useRef(isEnvBrowser());

  const setVisible = (visible: boolean) => {
    visibleRef.current = visible;
    document.documentElement.classList.toggle("nxg-nui-hidden", !visible);
    document.body.style.visibility = visible ? "visible" : "hidden";
  };

  useEffect(() => {
    // FiveM CEF keeps the page loaded — start hidden until computer:open
    if (!isEnvBrowser()) {
      setVisible(false);
    }

    void fetchNui("computer:ready", {}, { ok: true });

    const offOpen = onNuiEvent("computer:open", () => {
      if (stateRef.current.poweredOff) {
        dispatch({ type: "system/POWER_ON" });
      }
      setVisible(true);
    });

    const offClose = onNuiEvent("computer:close", () => {
      setVisible(false);
      dispatch({ type: "section/RESET" });
      dispatch({ type: "settings/CLOSE" });
      dispatch({ type: "context/CLOSE" });
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!visibleRef.current && !isEnvBrowser()) return;
      // Calculator (and other apps) may handle Escape in capture phase
      if (e.defaultPrevented) return;

      const s = stateRef.current;

      if (s.poweredOff) return;

      if (s.contextMenu?.open) {
        e.preventDefault();
        dispatch({ type: "context/CLOSE" });
        return;
      }
      if (s.settings?.open) {
        e.preventDefault();
        dispatch({ type: "settings/CLOSE" });
        return;
      }
      if (s.section && s.section !== "none") {
        e.preventDefault();
        dispatch({ type: "section/RESET" });
        return;
      }

      // Don't lock / close while an app is frontmost (Escape = in-app cancel)
      if (
        s.onTop &&
        s.onTop !== "wallpaper" &&
        s.openApps?.[s.onTop]
      ) {
        return;
      }
      if (s.settings?.wallpaper?.open) {
        e.preventDefault();
        dispatch({ type: "wallpaper/CLOSE" });
        return;
      }

      e.preventDefault();
      if (isEnvBrowser()) {
        dispatch({ type: "auth/LOCK" });
        return;
      }
      void fetchNui("computer:close", {}, { ok: true });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      offOpen();
      offClose();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dispatch]);

  return null;
}
