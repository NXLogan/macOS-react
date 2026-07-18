import React, { useCallback, useEffect, useRef, useState } from "react";
import "./DesktopMarquee.scss";

export type MarqueeRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const BLOCKED_SELECTORS = [
  ".nav-bar",
  ".dock",
  ".window",
  ".wallpaper-menu",
  ".settings-dropdown",
  ".context-menu",
  ".dropdown-menu",
  ".lock-screen",
  ".bootup-window",
  ".fichiers-window",
  ".parametres-window",
  ".calculator-window",
  ".corbeille-window",
  ".nxg-drag-root",
  ".desktop-icon",
  ".desktop-selection",
];

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return true;
  return BLOCKED_SELECTORS.some((sel) => target.closest(sel));
}

function emitMarquee(
  phase: "start" | "update" | "end",
  rect: MarqueeRect | null
) {
  window.dispatchEvent(
    new CustomEvent("nxg-desktop-marquee", {
      detail: { phase, rect },
    })
  );
}

export default function DesktopMarquee() {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<MarqueeRect | null>(null);
  const active = useRef(false);
  const rectRef = useRef<MarqueeRect | null>(null);

  const buildRect = useCallback((x: number, y: number): MarqueeRect | null => {
    if (!origin.current) return null;
    const x1 = origin.current.x;
    const y1 = origin.current.y;
    return {
      left: Math.min(x1, x),
      top: Math.min(y1, y),
      width: Math.abs(x - x1),
      height: Math.abs(y - y1),
    };
  }, []);

  const updateRect = useCallback(
    (x: number, y: number) => {
      const next = buildRect(x, y);
      if (!next) return;
      rectRef.current = next;
      setRect(next);
      if (next.width > 2 || next.height > 2) {
        emitMarquee("update", next);
      }
    },
    [buildRect]
  );

  const stop = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    const finalRect = rectRef.current;
    origin.current = null;
    rectRef.current = null;
    setRect(null);
    emitMarquee("end", finalRect);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!active.current) return;
      updateRect(e.clientX, e.clientY);
    };

    const onUp = () => {
      if (!active.current) return;
      stop();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onUp);
    };
  }, [stop, updateRect]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;

    active.current = true;
    origin.current = { x: e.clientX, y: e.clientY };
    const start: MarqueeRect = {
      left: e.clientX,
      top: e.clientY,
      width: 0,
      height: 0,
    };
    rectRef.current = start;
    setRect(start);
    emitMarquee("start", start);
  };

  return (
    <div className="desktop-marquee-layer" onMouseDown={onMouseDown}>
      {rect && rect.width + rect.height > 0 ? (
        <div
          className="desktop-selection"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : null}
    </div>
  );
}
