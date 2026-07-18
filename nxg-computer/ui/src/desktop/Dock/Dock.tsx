import React, { useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, Reorder } from "framer-motion";
import { createPortal } from "react-dom";
import { store } from "../../App";
import {
  DesktopIcon,
  DockApp,
  APP_CATALOG,
  ensureCoreDockApps,
  isOpenableAppId,
  isOverDock,
  snapDesktopPosition,
} from "./dockApps";
import { isAppInstalled } from "../../apps/registry";
import { useT } from "../../i18n/useT";
import "./Dock.scss";

function dockSizeClass(count: number) {
  if (count <= 2) return "dock-size-xs";
  if (count <= 4) return "dock-size-sm";
  if (count <= 7) return "dock-size-md";
  if (count <= 10) return "dock-size-lg";
  return "dock-size-xl";
}

export default function Dock() {
  const [state, dispatch] = useContext(store);
  const t = useT();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverLocked, setHoverLocked] = useState(false);
  const [dockDropHover, setDockDropHover] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hoverIndex, setHoverIndex] = useState<number | undefined>(undefined);
  const [localApps, setLocalApps] = useState<DockApp[]>(state.dockApps);
  const didDrag = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const dragItem = useRef<DockApp | null>(null);
  const localAppsRef = useRef(localApps);
  localAppsRef.current = localApps;

  useEffect(() => {
    if (draggingId) return;
    setLocalApps(state.dockApps);
  }, [state.dockApps, draggingId]);

  useEffect(() => {
    if (!state.session?.ready) return;
    const next = ensureCoreDockApps(state.dockApps, state.desktopIcons);
    let payload = next;

    // One-shot: seed newly catalogued apps into the Dock for existing profiles
    const MIGRATE_KEY = "nxg-dock-catalog-v2";
    if (!localStorage.getItem(MIGRATE_KEY)) {
      const onDesktop = new Set(
        state.desktopIcons
          .filter((i: { kind?: string }) => i.kind !== "folder")
          .map((i: { id: string }) => i.id)
      );
      const present = new Set(payload.map((a: DockApp) => a.id));
      const seeded = [...payload];
      for (const app of APP_CATALOG) {
        if (present.has(app.id) || onDesktop.has(app.id)) continue;
        if (!isOpenableAppId(app.id) || !isAppInstalled(app.id)) continue;
        seeded.push(app);
        present.add(app.id);
      }
      payload = seeded;
      localStorage.setItem(MIGRATE_KEY, "1");
    }

    if (
      payload.length !== state.dockApps.length ||
      payload.some((a, i) => a.id !== state.dockApps[i]?.id)
    ) {
      dispatch({ type: "dock/REORDER", payload });
    }
  }, [state.session?.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const syncInstalled = () => {
      const next = ensureCoreDockApps(state.dockApps, state.desktopIcons);
      dispatch({ type: "dock/REORDER", payload: next });
    };
    window.addEventListener("nxg-apps-installed", syncInstalled);
    return () => window.removeEventListener("nxg-apps-installed", syncInstalled);
  }, [state.dockApps, state.desktopIcons, dispatch]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
      if (draggingId) {
        setCursor({ x: e.clientX, y: e.clientY });
        const over = isOverDock(e.clientX, e.clientY);
        setExtracting(!over);
      }
    };
    const onDesktopDrag = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        over?: boolean;
        dragging?: boolean;
      };
      if (typeof detail?.over === "boolean") {
        setDockDropHover(detail.over);
      }
      if (detail?.dragging === false) {
        setDockDropHover(false);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("nxg-desktop-drag", onDesktopDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("nxg-desktop-drag", onDesktopDrag);
    };
  }, [draggingId]);

  const selectDockItem = (index: number) => {
    if (draggingId || hoverLocked) return;
    setHoverIndex((prev) => (prev === index ? prev : index));
  };

  const resetDock = () => {
    if (draggingId) return;
    setHoverIndex(undefined);
  };

  const onReorder = (next: DockApp[]) => {
    if (extracting) return;
    setLocalApps(next);
  };

  const beginDrag = (item: DockApp) => {
    didDrag.current = true;
    dragItem.current = item;
    setDraggingId(item.id);
    setHoverLocked(true);
    setExtracting(false);
    setHoverIndex(undefined);
    setCursor({ ...pointer.current });
  };

  const endDrag = (item: DockApp) => {
    const { x: clientX, y: clientY } = pointer.current;
    const droppingToDesktop = !isOverDock(clientX, clientY);
    const ordered = localAppsRef.current;

    setDraggingId(null);
    setExtracting(false);
    dragItem.current = null;
    setHoverIndex(undefined);

    if (droppingToDesktop) {
      const pos = snapDesktopPosition(clientX - 36, clientY - 36);
      // ADD_ICON before REMOVE so core apps can leave the dock (reducer checks desktop)
      dispatch({
        type: "desktop/ADD_ICON",
        payload: {
          id: item.id,
          name: item.name,
          icon: item.icon,
          kind: "app",
          x: pos.x,
          y: pos.y,
        } as DesktopIcon,
      });
      dispatch({ type: "dock/REMOVE", payload: item.id });
    } else {
      dispatch({ type: "dock/REORDER", payload: ordered });
    }

    window.setTimeout(() => {
      setHoverLocked(false);
      didDrag.current = false;
    }, 160);
  };

  const openApp = (item: DockApp) => {
    if (didDrag.current || draggingId) return;
    if (isOpenableAppId(item.id)) {
      if (
        item.id === "fichiers" &&
        state.settings?.prefs?.permissions?.files === false
      ) {
        window.dispatchEvent(
          new CustomEvent("nxg-toast", {
            detail: {
              message: "Accès Fichiers désactivé — Paramètres → Confidentialité",
            },
          })
        );
        dispatch({ type: "apps/OPEN", payload: "parametres" });
        window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("nxg-parametres-section", {
              detail: "confidentialite",
            })
          );
        }, 40);
        return;
      }
      const chrome = state.windowChrome?.[item.id];
      if (state.openApps?.[item.id] && chrome?.minimized) {
        dispatch({ type: "window/RESTORE", payload: item.id });
        return;
      }
      dispatch({ type: "apps/OPEN", payload: item.id });
    }
  };

  const distanceClass = (index: number) => {
    if (draggingId || hoverLocked || hoverIndex === undefined) return "";
    const d = Math.abs(hoverIndex - index);
    if (d === 0) return "hovered";
    if (d === 1) return "distance-1";
    if (d === 2) return "distance-2";
    return "";
  };

  const apps = draggingId ? localApps : state.dockApps;
  const count = apps.length;
  const dockPos = state.settings?.prefs?.dockPosition || "bottom";
  const reorderAxis = dockPos === "left" || dockPos === "right" ? "y" : "x";
  const dragApp =
    draggingId && extracting
      ? apps.find((a: DockApp) => a.id === draggingId) || dragItem.current
      : null;

  return (
    <div className={`dock-shell dock-pos-${dockPos}`}>
      <Reorder.Group
        as="div"
        axis={reorderAxis}
        values={apps}
        onReorder={onReorder}
        className={`dock ${dockSizeClass(count)} ${
          draggingId ? "is-dragging" : ""
        } ${extracting ? "is-extracting" : ""} ${
          dockDropHover ? "dock-drop-hover" : ""
        }`}
        onMouseLeave={resetDock}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {apps.map((item: DockApp, index: number) => {
            const isDrag = draggingId === item.id;
            const hideInDock = isDrag && extracting;
            return (
              <Reorder.Item
                as="div"
                key={item.id}
                value={item}
                id={item.id}
                initial={{ opacity: 0, scale: 0.6, y: 18 }}
                animate={{
                  opacity: hideInDock ? 0 : 1,
                  scale: hideInDock ? 0.5 : 1,
                  y: 0,
                }}
                exit={{ opacity: 0, scale: 0.55, y: 22 }}
                className={`dock-item ${
                  state.openApps?.[item.id] ? "" : "no-point"
                } ${
                  state.windowChrome?.[item.id]?.minimized
                    ? "is-minimized-app"
                    : ""
                } ${distanceClass(index)} ${
                  isDrag ? "is-dragging-item" : ""
                } ${hideInDock ? "is-ghosted" : ""}`}
                data-index={index}
                onMouseEnter={() => selectDockItem(index)}
                onPointerDown={() => {
                  didDrag.current = false;
                }}
                onClick={() => openApp(item)}
                onDragStart={() => beginDrag(item)}
                onDragEnd={() => endDrag(item)}
                whileDrag={
                  extracting
                    ? { opacity: 0, scale: 0.5, zIndex: 1 }
                    : {
                        scale: 1.12,
                        zIndex: 80,
                        filter: "brightness(1.08)",
                      }
                }
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
                style={{ pointerEvents: hideInDock ? "none" : "auto" }}
              >
                <div className="tool-tip">{t(`apps.${item.id}.name`) !== `apps.${item.id}.name` ? t(`apps.${item.id}.name`) : item.name}</div>
                <img
                  alt={item.name}
                  className={`dock-icon ${
                    item.id === "fichiers" ? "is-fichiers" : ""
                  }`}
                  src={require(`../../assets/images/webp/${item.icon}`)}
                  draggable={false}
                />
                {state.openApps?.[item.id] ? <div className="point" /> : null}
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>

      {dragApp
        ? createPortal(
            <div
              className="dock-drag-follow"
              style={{
                left: cursor.x,
                top: cursor.y,
              }}
            >
              <img
                src={require(`../../assets/images/webp/${dragApp.icon}`)}
                alt=""
                draggable={false}
              />
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
