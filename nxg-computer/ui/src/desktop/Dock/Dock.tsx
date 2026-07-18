import React, {
  MouseEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import { store } from "../../App";
import identifyDockItem from "../../utils/helpers/identifyDockItem";
import {
  DesktopIcon,
  DockApp,
  isOverDock,
  snapDesktopPosition,
} from "./dockApps";
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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverLocked, setHoverLocked] = useState(false);
  const [dockDropHover, setDockDropHover] = useState(false);
  const [ghost, setGhost] = useState<{
    id: string;
    name: string;
    icon: string;
    x: number;
    y: number;
  } | null>(null);
  const didDrag = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
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
  }, []);

  const selectDockItem = (e: MouseEvent) => {
    if (draggingId || hoverLocked) return;
    const id = identifyDockItem(e.target);
    if (id === undefined || Number.isNaN(id)) return;
    dispatch({ type: "dock/SELECT", payload: id });
  };

  const resetDock = () => {
    if (draggingId) return;
    dispatch({ type: "dock/RESET" });
  };

  const onReorder = (next: DockApp[]) => {
    dispatch({ type: "dock/REORDER", payload: next });
  };

  const beginDrag = (id: string) => {
    didDrag.current = true;
    setDraggingId(id);
    setHoverLocked(true);
    dispatch({ type: "dock/RESET" });
  };

  const endDrag = (item: DockApp) => {
    const { x: clientX, y: clientY } = pointer.current;
    const droppingToDesktop = !isOverDock(clientX, clientY);

    setDraggingId(null);
    dispatch({ type: "dock/RESET" });

    if (droppingToDesktop) {
      const pos = snapDesktopPosition(clientX - 36, clientY - 36);
      setGhost({
        id: item.id,
        name: item.name,
        icon: item.icon,
        x: clientX - 28,
        y: clientY - 28,
      });
      dispatch({ type: "dock/REMOVE", payload: item.id });

      window.requestAnimationFrame(() => {
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
        setGhost(null);
      });
    }

    window.setTimeout(() => {
      setHoverLocked(false);
      didDrag.current = false;
    }, 180);
  };

  const openApp = (item: DockApp) => {
    if (didDrag.current || draggingId) return;
    if (item.id === "fichiers" || item.id === "parametres") {
      dispatch({ type: "apps/OPEN", payload: item.id });
    }
  };

  const distanceClass = (index: number) => {
    if (draggingId || hoverLocked || state.dockItem === undefined) return "";
    const d = Math.abs(state.dockItem - index);
    if (d === 0) return "hovered";
    if (d === 1) return "distance-1";
    if (d === 2) return "distance-2";
    return "";
  };

  const count = state.dockApps.length;
  const dockPos = state.settings?.prefs?.dockPosition || "bottom";
  const reorderAxis = dockPos === "left" || dockPos === "right" ? "y" : "x";

  return (
    <div className="dock-shell">
      <Reorder.Group
        as="div"
        axis={reorderAxis}
        values={state.dockApps}
        onReorder={onReorder}
        layout
        className={`dock ${dockSizeClass(count)} ${
          draggingId ? "is-dragging" : ""
        } ${dockDropHover ? "dock-drop-hover" : ""}`}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {state.dockApps.map((item: DockApp, index: number) => (
            <Reorder.Item
              as="div"
              key={item.id}
              value={item}
              id={item.id}
              layout
              initial={{ opacity: 0, scale: 0.6, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.55, y: 22 }}
              className={`dock-item ${
                state.openApps?.[item.id] ? "" : "no-point"
              } ${distanceClass(index)} ${
                draggingId === item.id ? "is-dragging-item" : ""
              }`}
              onMouseEnter={selectDockItem}
              onMouseMove={selectDockItem}
              onMouseLeave={resetDock}
              onPointerDown={() => {
                didDrag.current = false;
                dispatch({ type: "dock/RESET" });
              }}
              onClick={() => openApp(item)}
              onDragStart={() => beginDrag(item.id)}
              onDragEnd={() => endDrag(item)}
              whileDrag={{
                scale: 1.18,
                zIndex: 80,
                filter: "brightness(1.1)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
              }}
              transition={{ type: "spring", stiffness: 520, damping: 34 }}
            >
              <div className="tool-tip">{item.name}</div>
              <motion.img
                layoutId={`nxg-app-${item.id}`}
                alt={item.name}
                className={`dock-icon ${item.id === "fichiers" ? "finder" : ""}`}
                src={require(`../../assets/images/webp/${item.icon}`)}
                draggable={false}
                transition={{ type: "spring", stiffness: 480, damping: 36 }}
              />
              {state.openApps?.[item.id] ? <div className="point" /> : null}
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      <AnimatePresence>
        {ghost ? (
          <motion.img
            key={`ghost-${ghost.id}`}
            className="dock-fly-ghost"
            src={require(`../../assets/images/webp/${ghost.icon}`)}
            alt=""
            initial={{
              opacity: 1,
              scale: 1.15,
              x: ghost.x,
              y: ghost.y,
            }}
            animate={{
              opacity: 0,
              scale: 0.9,
              x: ghost.x,
              y: ghost.y - 8,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
