import React, { useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { store } from "../../App";
import {
  DesktopIcon,
  dockInsertIndex,
  isOverDock,
  snapDesktopPosition,
} from "../Dock/dockApps";
import "./DesktopIcons.scss";

export default function DesktopIcons() {
  const [state, dispatch] = useContext(store);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overDock, setOverDock] = useState(false);
  const dragMoved = useRef(false);

  const emitDockHover = (over: boolean, dragging = true) => {
    window.dispatchEvent(
      new CustomEvent("nxg-desktop-drag", {
        detail: { over, dragging },
      })
    );
  };

  const openApp = (icon: DesktopIcon) => {
    if (dragMoved.current) return;
    // Folders: only open via double-click (handled separately)
    if (icon.kind === "folder") return;
    if (icon.id === "fichiers" || icon.id === "parametres") {
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
            key={icon.id}
            type="button"
            layout
            className={`desktop-icon ${
              selectedId === icon.id ? "selected" : ""
            } ${draggingId === icon.id ? "is-dragging-icon" : ""} ${
              overDock && draggingId === icon.id ? "will-dock" : ""
            }`}
            style={{ left: icon.x, top: icon.y }}
            initial={{ opacity: 0, scale: 0.7, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.55, y: 16 }}
            transition={{ type: "spring", stiffness: 460, damping: 32 }}
            drag
            dragMomentum={false}
            dragElastic={0.08}
            onPointerDown={() => {
              dragMoved.current = false;
              setSelectedId(icon.id);
            }}
            onDragStart={() => {
              setDraggingId(icon.id);
              emitDockHover(false, true);
            }}
            onDrag={(_, info) => {
              dragMoved.current = true;
              const x = icon.x + info.offset.x + 42;
              const y = icon.y + info.offset.y + 42;
              const over =
                icon.kind !== "folder" && isOverDock(x, y);
              setOverDock(over);
              emitDockHover(over, true);
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

              const shouldDock =
                icon.kind !== "folder" && isOverDock(clientX, clientY);

              setDraggingId(null);
              setOverDock(false);
              emitDockHover(false, false);

              if (shouldDock) {
                dispatch({ type: "desktop/REMOVE_ICON", payload: icon.id });
                dispatch({
                  type: "dock/ADD",
                  payload: {
                    id: icon.id,
                    name: icon.name,
                    icon: icon.icon,
                  },
                  index: dockInsertIndex(clientX),
                });
                setSelectedId(null);
                return;
              }

              const next = snapDesktopPosition(
                icon.x + info.offset.x,
                icon.y + info.offset.y
              );
              dispatch({
                type: "desktop/MOVE_ICON",
                payload: { id: icon.id, x: next.x, y: next.y },
              });
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
              scale: overDock ? 0.88 : 1.08,
              zIndex: 80,
              filter: overDock
                ? "brightness(1.15) drop-shadow(0 0 12px rgba(10,132,255,0.65))"
                : "brightness(1.05)",
            }}
          >
            <motion.img
              layoutId={
                icon.kind === "folder" ? undefined : `nxg-app-${icon.id}`
              }
              src={require(`../../assets/images/webp/${icon.icon}`)}
              alt={icon.name}
              draggable={false}
              transition={{ type: "spring", stiffness: 480, damping: 36 }}
            />
            <span className="desktop-icon-label">{icon.name}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
