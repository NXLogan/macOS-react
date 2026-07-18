import React, { useCallback, useEffect, useRef, useState } from "react";
import "./DesktopMarquee.scss";

type Rect = { left: number; top: number; width: number; height: number };

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
  ".desktop-icon",
  ".desktop-selection",
];

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return true;
  return BLOCKED_SELECTORS.some((sel) => target.closest(sel));
}

export default function DesktopMarquee() {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const active = useRef(false);

  const updateRect = useCallback((x: number, y: number) => {
    if (!origin.current) return;
    const x1 = origin.current.x;
    const y1 = origin.current.y;
    setRect({
      left: Math.min(x1, x),
      top: Math.min(y1, y),
      width: Math.abs(x - x1),
      height: Math.abs(y - y1),
    });
  }, []);

  const stop = useCallback(() => {
    active.current = false;
    origin.current = null;
    setRect(null);
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
    setRect({
      left: e.clientX,
      top: e.clientY,
      width: 0,
      height: 0,
    });
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
