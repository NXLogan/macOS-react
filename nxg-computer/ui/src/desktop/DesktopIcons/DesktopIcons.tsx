import React, { useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { store } from "../../App";
import {
  canDockDesktopIcon,
  DesktopIcon,
  dockInsertIndex,
  isOpenableAppId,
  isOverDock,
  snapDesktopPosition,
} from "../Dock/dockApps";
import {
  desktopFoldersNeedUpdate,
  reconcileDesktopFolders,
} from "./reconcileDesktop";
import "./DesktopIcons.scss";

export { reconcileDesktopFolders } from "./reconcileDesktop";

export default function DesktopIcons() {
  const [state, dispatch] = useContext(store);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overDock, setOverDock] = useState(false);
  /** Bumps to remount an icon and clear a stuck drag transform (e.g. rejected dock drop). */
  const [dragEpoch, setDragEpoch] = useState<Record<string, number>>({});
  const dragMoved = useRef(false);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const iconsRef = useRef(state.desktopIcons);
  iconsRef.current = state.desktopIcons;

  useEffect(() => {
    const sync = () => {
      const reconciled = reconcileDesktopFolders(iconsRef.current);
      if (desktopFoldersNeedUpdate(iconsRef.current, reconciled)) {
        dispatch({ type: "desktop/SET_ICONS", payload: reconciled });
      }
    };
    sync();
    window.addEventListener("nxg-fs-changed", sync);
    window.addEventListener("nxg-memory-hydrated", sync);
    return () => {
      window.removeEventListener("nxg-fs-changed", sync);
      window.removeEventListener("nxg-memory-hydrated", sync);
    };
  }, [dispatch]);

  useEffect(() => {
    const clear = () => setSelectedId(null);
    window.addEventListener("nxg-desktop-clear-selection", clear);
    return () =>
      window.removeEventListener("nxg-desktop-clear-selection", clear);
  }, []);

  const emitDockHover = (over: boolean, dragging = true) => {
    window.dispatchEvent(
      new CustomEvent("nxg-desktop-drag", {
        detail: { over, dragging },
      })
    );
  };

  const bumpEpoch = (id: string) => {
    setDragEpoch((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const openApp = (icon: DesktopIcon) => {
    if (dragMoved.current) return;
    if (icon.kind === "folder") return;
    if (isOpenableAppId(icon.id)) {
      dispatch({ type: "apps/OPEN", payload: icon.id });
    }
  };

  const openFolder = (icon: DesktopIcon) => {
    if (dragMoved.current) return;
    if (icon.kind === "folder" && icon.folderId) {
      dispatch({
        type: "apps/OPEN",
        payload: "fichiers",
        folderId: icon.folderId,
      });
    }
  };

  return (
    <div
      className={`desktop-icons-layer ${draggingId ? "is-dragging" : ""} ${
        overDock ? "over-dock" : ""
      }`}
    >
      <AnimatePresence>
        {state.desktopIcons.map((icon: DesktopIcon) => (
          <motion.button
            key={`${icon.id}-${dragEpoch[icon.id] || 0}`}
            type="button"
            layout
            className={`desktop-icon ${
              selectedId === icon.id ? "selected" : ""
            } ${draggingId === icon.id ? "is-dragging-icon" : ""} ${
              overDock && draggingId === icon.id ? "will-dock" : ""
            } ${
              overDock &&
              draggingId === icon.id &&
              !canDockDesktopIcon(icon)
                ? "cant-dock"
                : ""
            }`}
            style={{ left: icon.x, top: icon.y }}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.7, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.55, y: 16 }}
            transition={{ type: "spring", stiffness: 460, damping: 32 }}
            drag
            dragMomentum={false}
            dragElastic={0.08}
            onPointerDown={() => {
              dragMoved.current = false;
              dragOrigin.current = { x: icon.x, y: icon.y };
              setSelectedId(icon.id);
            }}
            onDragStart={() => {
              setDraggingId(icon.id);
              dragOrigin.current = { x: icon.x, y: icon.y };
              emitDockHover(false, true);
            }}
            onDrag={(_, info) => {
              dragMoved.current = true;
              const x = icon.x + info.offset.x + 42;
              const y = icon.y + info.offset.y + 42;
              const over = isOverDock(x, y);
              setOverDock(over);
              // Only light up the dock for icons that can actually pin
              emitDockHover(over && canDockDesktopIcon(icon), true);
            }}
            onDragEnd={(event, info) => {
              const clientX =
                "clientX" in event
                  ? (event as PointerEvent).clientX
                  : icon.x + info.offset.x + 36;
              const clientY =
                "clientY" in event
                  ? (event as PointerEvent).clientY
                  : icon.y + info.offset.y + 36;

              const over = isOverDock(clientX, clientY);
              const dockable = canDockDesktopIcon(icon);

              setDraggingId(null);
              setOverDock(false);
              emitDockHover(false, false);

              // Folders (and unknown icons) dropped on the Dock: snap back home
              if (over && !dockable) {
                const origin = dragOrigin.current || {
                  x: icon.x,
                  y: icon.y,
                };
                dispatch({
                  type: "desktop/MOVE_ICON",
                  payload: { id: icon.id, x: origin.x, y: origin.y },
                });
                bumpEpoch(icon.id);
                return;
              }

              // Drop ON the dock bar → pin to hotbar (apps only)
              if (over && dockable) {
                const alreadyInDock = state.dockApps.some(
                  (a: { id: string }) => a.id === icon.id
                );
                dispatch({ type: "desktop/REMOVE_ICON", payload: icon.id });
                if (!alreadyInDock) {
                  dispatch({
                    type: "dock/ADD",
                    payload: {
                      id: icon.id,
                      name: icon.name,
                      icon: icon.icon,
                    },
                    index: dockInsertIndex(clientX),
                  });
                }
                setSelectedId(null);
                return;
              }

              // Anywhere else on the desktop (corners included)
              const next = snapDesktopPosition(
                icon.x + info.offset.x,
                icon.y + info.offset.y
              );
              dispatch({
                type: "desktop/MOVE_ICON",
                payload: { id: icon.id, x: next.x, y: next.y },
              });
              bumpEpoch(icon.id);
            }}
            onClick={() => openApp(icon)}
            onDoubleClick={() => {
              if (icon.kind === "folder") openFolder(icon);
              else openApp(icon);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedId(icon.id);
              dispatch({
                type: "context/OPEN",
                payload: {
                  x: e.clientX,
                  y: e.clientY,
                  target: "icon",
                  targetId: icon.id,
                },
              });
            }}
            whileDrag={{
              scale: overDock
                ? canDockDesktopIcon(icon)
                  ? 0.88
                  : 0.96
                : 1.08,
              zIndex: 80,
              filter: overDock
                ? canDockDesktopIcon(icon)
                  ? "brightness(1.15) drop-shadow(0 0 12px rgba(10,132,255,0.65))"
                  : "brightness(0.9) saturate(0.7)"
                : "brightness(1.05)",
            }}
          >
            <img
              src={require(`../../assets/images/webp/${icon.icon}`)}
              alt={icon.name}
              draggable={false}
            />
            <span className="desktop-icon-label">{icon.name}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
