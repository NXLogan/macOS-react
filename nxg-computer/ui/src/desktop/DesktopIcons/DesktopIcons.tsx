import React, { useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { store } from "../../App";
import {
  canDockDesktopIcon,
  DesktopIcon,
  dockInsertIndex,
  isDesktopDropOnDock,
  isOpenableAppId,
  snapDesktopPosition,
} from "../Dock/dockApps";
import { pinAppToDock } from "../Dock/dockPin";
import {
  desktopFoldersNeedUpdate,
  reconcileDesktopFolders,
} from "./reconcileDesktop";
import type { MarqueeRect } from "../DesktopMarquee/DesktopMarquee";
import { useT } from "../../i18n/useT";
import "./DesktopIcons.scss";

export { reconcileDesktopFolders } from "./reconcileDesktop";

function rectsIntersect(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number }
) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function idsHitByMarquee(rect: MarqueeRect): string[] {
  const box = {
    left: rect.left,
    top: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
  };
  // Use live DOM rects (client coords) so hit-test matches the blue marquee
  const hits: string[] = [];
  document.querySelectorAll<HTMLElement>(".desktop-icon[data-icon-id]").forEach(
    (el) => {
      const r = el.getBoundingClientRect();
      if (
        rectsIntersect(box, {
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
        })
      ) {
        const id = el.dataset.iconId;
        if (id) hits.push(id);
      }
    }
  );
  return hits;
}

export default function DesktopIcons() {
  const [state, dispatch] = useContext(store);
  const t = useT();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overDock, setOverDock] = useState(false);
  const [dragEpoch, setDragEpoch] = useState<Record<string, number>>({});
  const dragMoved = useRef(false);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const iconsRef = useRef(state.desktopIcons);
  iconsRef.current = state.desktopIcons;
  const selectedRef = useRef(selectedIds);
  selectedRef.current = selectedIds;

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [draggingId]);

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
    const clear = () => setSelectedIds([]);
    window.addEventListener("nxg-desktop-clear-selection", clear);
    return () =>
      window.removeEventListener("nxg-desktop-clear-selection", clear);
  }, []);

  useEffect(() => {
    const onMarquee = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        phase: "start" | "update" | "end";
        rect: MarqueeRect | null;
      };
      if (!detail) return;

      if (detail.phase === "start") {
        setSelectedIds([]);
        return;
      }

      if ((detail.phase === "update" || detail.phase === "end") && detail.rect) {
        if (detail.rect.width < 3 && detail.rect.height < 3) {
          if (detail.phase === "end") return;
        }
        setSelectedIds(idsHitByMarquee(detail.rect));
      }
    };
    window.addEventListener("nxg-desktop-marquee", onMarquee);
    return () => window.removeEventListener("nxg-desktop-marquee", onMarquee);
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
        {state.desktopIcons.map((icon: DesktopIcon) => {
          const isSelected = selectedIds.includes(icon.id);
          return (
            <motion.button
              key={`${icon.id}-${dragEpoch[icon.id] || 0}`}
              type="button"
              data-icon-id={icon.id}
              layout
              className={`desktop-icon ${isSelected ? "selected" : ""} ${
                draggingId === icon.id ? "is-dragging-icon" : ""
              } ${
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
              onPointerDown={(e) => {
                dragMoved.current = false;
                pointer.current = { x: e.clientX, y: e.clientY };
                dragOrigin.current = { x: icon.x, y: icon.y };
                if (e.shiftKey || e.metaKey || e.ctrlKey) {
                  setSelectedIds((prev) =>
                    prev.includes(icon.id)
                      ? prev.filter((id) => id !== icon.id)
                      : [...prev, icon.id]
                  );
                } else if (!selectedRef.current.includes(icon.id)) {
                  setSelectedIds([icon.id]);
                }
              }}
              onDragStart={() => {
                setDraggingId(icon.id);
                dragOrigin.current = { x: icon.x, y: icon.y };
                emitDockHover(false, true);
              }}
              onDrag={(event) => {
                dragMoved.current = true;
                const clientX =
                  "clientX" in event
                    ? (event as PointerEvent).clientX
                    : pointer.current.x;
                const clientY =
                  "clientY" in event
                    ? (event as PointerEvent).clientY
                    : pointer.current.y;
                pointer.current = { x: clientX, y: clientY };
                const el = document.querySelector(
                  `.desktop-icon[data-icon-id="${icon.id}"]`
                );
                const over = isDesktopDropOnDock(clientX, clientY, el);
                setOverDock(over);
                emitDockHover(over && canDockDesktopIcon(icon), true);
              }}
              onDragEnd={() => {
                const { x: clientX, y: clientY } = pointer.current;
                const el = document.querySelector(
                  `.desktop-icon[data-icon-id="${icon.id}"]`
                );
                const over = isDesktopDropOnDock(clientX, clientY, el);
                const dockable = canDockDesktopIcon(icon);

                setDraggingId(null);
                setOverDock(false);
                emitDockHover(false, false);

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

                if (over && dockable) {
                  pinAppToDock(
                    dispatch,
                    state,
                    {
                      id: icon.id,
                      name: icon.name,
                      icon: icon.icon,
                    },
                    dockInsertIndex(clientX, clientY)
                  );
                  setSelectedIds((prev) => prev.filter((id) => id !== icon.id));
                  return;
                }

                const next = snapDesktopPosition(
                  clientX - 42,
                  clientY - 42
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
                if (!selectedRef.current.includes(icon.id)) {
                  setSelectedIds([icon.id]);
                }
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
              <span className="desktop-icon-label">
                {icon.kind === "folder"
                  ? icon.name
                  : t(`apps.${icon.id}.name`).startsWith("apps.")
                    ? icon.name
                    : t(`apps.${icon.id}.name`)}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
