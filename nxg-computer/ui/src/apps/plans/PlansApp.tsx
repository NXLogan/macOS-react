import React, { useContext, useRef, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import "./PlansApp.scss";

type Place = {
  id: string;
  name: string;
  x: number;
  y: number;
  blurb: string;
};

const PLACES: Place[] = [
  { id: "ls", name: "Los Santos", x: 58, y: 68, blurb: "Métropole — centre-ville, port, aéroport." },
  { id: "vinewood", name: "Vinewood", x: 52, y: 48, blurb: "Collines, studios, panneau Vinewood." },
  { id: "sandy", name: "Sandy Shores", x: 62, y: 32, blurb: "Désert, aérodrome, trailer park." },
  { id: "paleto", name: "Paleto Bay", x: 38, y: 14, blurb: "Petite ville du nord." },
  { id: "chumash", name: "Chumash", x: 28, y: 52, blurb: "Côte ouest." },
  { id: "mirror", name: "Mirror Park", x: 64, y: 58, blurb: "Quartier résidentiel est." },
  { id: "docks", name: "Terminal", x: 72, y: 78, blurb: "Docks industriels." },
  { id: "airport", name: "LSIA", x: 48, y: 82, blurb: "Aéroport international." },
];

export default function PlansApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.plans);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<Place | null>(PLACES[0]);
  const [query, setQuery] = useState("");
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null
  );

  const filtered = PLACES.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  if (!open) return null;
  const closeApp = () => dispatch({ type: "apps/CLOSE", payload: "plans" });

  return (
    <AppWindowShell
      appId="plans"
      handle=".plans-titlebar"
      defaultPosition={{ x: 90, y: 60 }}
      windowClassName="plans-window"
      windowId="plans-window"
    >
      <div
        className="plans-hit"
        onMouseDown={() => dispatch({ type: "onTop/SET", payload: "plans" })}
      >
        <header className="plans-titlebar">
          <TrafficLights appId="plans" onClose={closeApp} />
          <div className="plans-title">Plans — San Andreas</div>
          <div className="plans-zoom">
            <button type="button" onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}>
              −
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.min(2.4, z + 0.15))}>
              +
            </button>
          </div>
        </header>
        <div className="plans-body">
          <aside className="plans-side">
            <input
              className="plans-search"
              placeholder="Rechercher un lieu…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="plans-places">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={selected?.id === p.id ? "active" : ""}
                  onClick={() => {
                    setSelected(p);
                    setOffset({
                      x: (50 - p.x) * 4,
                      y: (50 - p.y) * 4,
                    });
                  }}
                >
                  <strong>{p.name}</strong>
                  <span>{p.blurb}</span>
                </button>
              ))}
            </div>
          </aside>
          <div
            className="plans-viewport"
            onPointerDown={(e) => {
              drag.current = {
                x: e.clientX,
                y: e.clientY,
                ox: offset.x,
                oy: offset.y,
              };
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              setOffset({
                x: drag.current.ox + (e.clientX - drag.current.x),
                y: drag.current.oy + (e.clientY - drag.current.y),
              });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
          >
            <div
              className="plans-map"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            >
              <svg viewBox="0 0 100 100" className="plans-svg">
                <defs>
                  <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1a4a6e" />
                    <stop offset="100%" stopColor="#0d2a44" />
                  </linearGradient>
                  <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3d6b3a" />
                    <stop offset="40%" stopColor="#5a8f4a" />
                    <stop offset="100%" stopColor="#c2a66a" />
                  </linearGradient>
                </defs>
                <rect width="100" height="100" fill="url(#sea)" />
                <path
                  d="M18,8 L55,6 L72,18 L88,40 L92,70 L78,92 L45,96 L22,88 L12,60 L14,28 Z"
                  fill="url(#land)"
                  stroke="#2f4a2c"
                  strokeWidth="0.4"
                />
                <ellipse cx="55" cy="70" rx="22" ry="16" fill="#4a4a4a" opacity="0.55" />
                <ellipse cx="60" cy="34" rx="14" ry="10" fill="#c9a66b" opacity="0.7" />
                <path d="M30,55 Q40,48 50,55" fill="none" stroke="#6ec6ff" strokeWidth="1.2" />
                {PLACES.map((p) => (
                  <g
                    key={p.id}
                    className={`plans-pin ${selected?.id === p.id ? "on" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(p);
                    }}
                  >
                    <circle cx={p.x} cy={p.y} r="1.8" fill="#ff3b30" />
                    <circle cx={p.x} cy={p.y} r="3.2" fill="none" stroke="#fff" strokeWidth="0.4" />
                    <text x={p.x + 2.5} y={p.y - 2} fontSize="2.6" fill="#fff">
                      {p.name}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            {selected && (
              <div className="plans-card">
                <strong>{selected.name}</strong>
                <p>{selected.blurb}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppWindowShell>
  );
}
