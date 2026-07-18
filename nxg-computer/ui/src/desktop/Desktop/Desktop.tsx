import React, { useContext, useEffect } from "react";
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
    // Only preload wallpaper thumbnails here.
    wallpapers.forEach((picture) => {
      const img = new Image();
      img.src = picture.src;
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
            initial={{ opacity: 0, scale: 1.06, filter: "blur(16px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.05,
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
