import React, { useContext, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { store } from "../../App";
import checkDropdown from "../../utils/helpers/checkDropdown";
import checkSettings from "../../utils/helpers/checkSettings";
import wallpapers from "../../utils/helpers/wallpapers";
import BootScreen from "../BootScreen/BootScreen";
import LockScreen from "../LockScreen/LockScreen";
import DesktopMarquee from "../DesktopMarquee/DesktopMarquee";
import "./Desktop.scss";

export default function Desktop({ children }: any) {
  const [state, dispatch] = useContext(store);
  const skipIconClear = useRef(false);

  useEffect(() => {
    const onMarquee = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        phase?: string;
        rect?: { width: number; height: number } | null;
      };
      const phase = detail?.phase;
      // After a real marquee select, the following click would wipe selection
      if (phase === "end") {
        const rect = detail?.rect;
        const realDrag =
          rect && (rect.width > 2 || rect.height > 2);
        if (realDrag) {
          skipIconClear.current = true;
          window.setTimeout(() => {
            skipIconClear.current = false;
          }, 50);
        }
      }
    };
    window.addEventListener("nxg-desktop-marquee", onMarquee);
    return () => window.removeEventListener("nxg-desktop-marquee", onMarquee);
  }, []);

  const conditionalClick = (e: React.MouseEvent) => {
    if (state.booting || state.locked) return;

    if (state.contextMenu.open) {
      dispatch({ type: "context/CLOSE" });
    }

    const isDropdown = checkDropdown(e);
    if (isDropdown === false) {
      dispatch({
        type: "section/RESET",
      });
    }

    const isSettings = checkSettings(e);
    if (isSettings === false) {
      dispatch({
        type: "settings/CLOSE",
      });
    }

    // Deselect desktop icons when clicking empty desktop (not after marquee select)
    if (
      !skipIconClear.current &&
      !(e.target as HTMLElement).closest(".desktop-icon")
    ) {
      window.dispatchEvent(new Event("nxg-desktop-clear-selection"));
    }
  };

  const onContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (state.booting || state.locked) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    if (target.closest(".desktop-icon")) return;
    if (target.closest(".dock")) return;
    if (target.closest(".nav-bar")) return;
    if (target.closest(".fichiers-window")) return;
    if (target.closest(".parametres-window")) return;
    if (target.closest(".calculator-window")) return;
    if (target.closest(".corbeille-window")) return;
    if (target.closest(".wallpaper-menu")) return;
    if (target.closest(".context-menu")) return;

    dispatch({
      type: "context/OPEN",
      payload: {
        x: e.clientX,
        y: e.clientY,
        target: "desktop",
      },
    });
  };

  useEffect(() => {
    // Wallpaper / color / profile come from MemoryBootstrap.
    // Preload bundled wallpaper files via require (not broken relative strings).
    wallpapers.forEach((picture) => {
      try {
        const img = new Image();
        img.src = require(`../../assets/images/${picture.surname}.jpg`);
      } catch {
        /* missing asset */
      }
    });
  }, []);

  useEffect(() => {
    if (state.booting) return;
    sessionStorage.setItem(
      "boot",
      JSON.stringify({
        status: state.booting,
      })
    );
  }, [state.booting]);

  const showDesktop = !state.booting && !state.locked;

  return (
    <div
      className="page"
      id="page"
      onClick={conditionalClick}
      onContextMenu={onContextMenu}
    >
      <AnimatePresence mode="sync">
        {showDesktop ? (
          <motion.div
            key="desktop-shell"
            className="desktop-shell"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <DesktopMarquee />
            {children}
          </motion.div>
        ) : null}

        {!state.booting && state.locked ? (
          <LockScreen key="lock-screen" />
        ) : null}
      </AnimatePresence>

      {state.booting ? <BootScreen /> : null}
    </div>
  );
}
