import React, { useContext, useEffect, useRef, useState } from "react";
import Draggable, { DraggableEventHandler } from "react-draggable";
import { store } from "../../App";
import { windowStackZIndex } from "./windowStack";
import "./AppWindow.scss";

const CLOSE_MS = 240;
const OPEN_MS = 340;

type Props = {
  appId: string;
  handle: string;
  defaultPosition?: { x: number; y: number };
  children: React.ReactNode;
  className?: string;
  /** Extra class on the visual window (inner) */
  windowClassName: string;
  windowId: string;
};

/**
 * Drag shell + visual window.
 * Draggable owns transform on the outer root; animations run on the inner pane
 * so they are not overridden by react-draggable.
 */
export default function AppWindowShell({
  appId,
  handle,
  defaultPosition,
  children,
  className = "",
  windowClassName,
  windowId,
}: Props) {
  const [state, dispatch] = useContext(store);
  const chrome = state.windowChrome?.[appId] || {
    minimized: false,
    maximized: false,
  };
  const maximized = Boolean(chrome.maximized);
  const minimized = Boolean(chrome.minimized);
  const [opening, setOpening] = useState(true);
  const [closing, setClosing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [maxPulse, setMaxPulse] = useState(false);
  const wasMinimized = useRef(minimized);
  const wasMaximized = useRef(maximized);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpening(true);
    const t = window.setTimeout(() => setOpening(false), OPEN_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (wasMinimized.current && !minimized) {
      setRestoring(true);
      const t = window.setTimeout(() => setRestoring(false), 420);
      wasMinimized.current = minimized;
      return () => window.clearTimeout(t);
    }
    wasMinimized.current = minimized;
  }, [minimized]);

  useEffect(() => {
    if (wasMaximized.current !== maximized) {
      setMaxPulse(true);
      const t = window.setTimeout(() => setMaxPulse(false), 400);
      wasMaximized.current = maximized;
      return () => window.clearTimeout(t);
    }
  }, [maximized]);

  useEffect(() => {
    const onCloseRequest = (e: Event) => {
      const detail = (e as CustomEvent).detail as { appId?: string };
      if (detail?.appId !== appId || closing) return;
      setClosing(true);
    };
    window.addEventListener("nxg-window-close", onCloseRequest);
    return () =>
      window.removeEventListener("nxg-window-close", onCloseRequest);
  }, [appId, closing]);

  const frameClass = [
    "nxg-drag-root",
    className,
    maximized ? "is-maximized" : "",
    minimized ? "is-minimized" : "",
    closing ? "is-closing" : "",
    opening ? "is-opening" : "",
    restoring ? "is-restoring" : "",
    maxPulse ? (maximized ? "is-max-pulse" : "is-unmax-pulse") : "",
  ]
    .filter(Boolean)
    .join(" ");

  const paneClass = [
    windowClassName,
    "nxg-app-pane",
    maximized ? "is-maximized" : "",
    minimized ? "is-minimized" : "",
    closing ? "is-closing" : "",
    opening ? "is-opening" : "",
    restoring ? "is-restoring" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const bringToFront = () => {
    dispatch({ type: "onTop/SET", payload: appId });
  };

  const onStart: DraggableEventHandler = () => {
    bringToFront();
  };

  const zIndex = windowStackZIndex(
    state.windowOrder || [],
    appId,
    maximized
  );

  return (
    <Draggable
      nodeRef={nodeRef}
      handle={handle}
      cancel="button,input,textarea,a,.calc-btn,.nxg-traffic"
      bounds="parent"
      defaultPosition={defaultPosition}
      disabled={maximized || minimized || closing}
      onStart={onStart}
    >
      <div
        ref={nodeRef}
        className={frameClass}
        data-app-window={appId}
        style={{ zIndex }}
        onPointerDownCapture={bringToFront}
      >
        <div className={paneClass} id={windowId}>
          {children}
        </div>
      </div>
    </Draggable>
  );
}

export function requestWindowClose(
  appId: string,
  commit: () => void,
  ms = CLOSE_MS
) {
  window.dispatchEvent(
    new CustomEvent("nxg-window-close", { detail: { appId } })
  );
  window.setTimeout(commit, ms);
}

export function windowChromeClass(
  chrome?: { minimized?: boolean; maximized?: boolean }
) {
  const parts = ["nxg-app-window"];
  if (chrome?.minimized) parts.push("is-minimized");
  if (chrome?.maximized) parts.push("is-maximized");
  return parts.join(" ");
}

export { CLOSE_MS };
