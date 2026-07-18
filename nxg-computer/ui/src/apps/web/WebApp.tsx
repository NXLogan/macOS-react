import React, { useContext, useRef, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import "./WebApp.scss";

const HOME =
  "https://duckduckgo.com/html/?q=Los+Santos+news";

function normalizeUrl(input: string) {
  const raw = input.trim();
  if (!raw) return HOME;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.includes(" ") || !raw.includes(".")) {
    return `https://duckduckgo.com/html/?q=${encodeURIComponent(raw)}`;
  }
  return `https://${raw}`;
}

export default function WebApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.web);
  const [draft, setDraft] = useState("duckduckgo.com");
  const [url, setUrl] = useState(HOME);
  const [history, setHistory] = useState<string[]>([HOME]);
  const [index, setIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = (next: string, push = true) => {
    const resolved = normalizeUrl(next);
    setUrl(resolved);
    setDraft(resolved.replace(/^https?:\/\//i, ""));
    if (push) {
      const stack = [...history.slice(0, index + 1), resolved];
      setHistory(stack);
      setIndex(stack.length - 1);
    }
  };

  if (!open) return null;
  const closeApp = () => dispatch({ type: "apps/CLOSE", payload: "web" });

  return (
    <AppWindowShell
      appId="web"
      handle=".web-titlebar"
      defaultPosition={{ x: 80, y: 50 }}
      windowClassName="web-window"
      windowId="web-window"
    >
      <div
        className="web-hit"
        onMouseDown={() => dispatch({ type: "onTop/SET", payload: "web" })}
      >
        <header className="web-titlebar">
          <TrafficLights appId="web" onClose={closeApp} />
          <div className="web-nav">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => {
                const i = index - 1;
                setIndex(i);
                setUrl(history[i]);
                setDraft(history[i].replace(/^https?:\/\//i, ""));
              }}
            >
              ‹
            </button>
            <button
              type="button"
              disabled={index >= history.length - 1}
              onClick={() => {
                const i = index + 1;
                setIndex(i);
                setUrl(history[i]);
                setDraft(history[i].replace(/^https?:\/\//i, ""));
              }}
            >
              ›
            </button>
            <button type="button" onClick={() => navigate(HOME)}>
              ⌂
            </button>
          </div>
          <form
            className="web-omnibox"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(draft);
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Rechercher ou saisir une adresse"
              spellCheck={false}
            />
          </form>
        </header>
        <iframe
          ref={iframeRef}
          className="web-frame"
          title="Navigateur NXG"
          src={url}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
        <div className="web-hint">
          Certains sites bloquent l’affichage dans une fenêtre — essaie DuckDuckGo
          ou une URL directe.
        </div>
      </div>
    </AppWindowShell>
  );
}
