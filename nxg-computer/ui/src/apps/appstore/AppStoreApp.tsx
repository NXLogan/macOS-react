import React, { useContext, useEffect, useMemo, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import {
  FULL_APP_CATALOG,
  installApp,
  isAppInstalled,
  loadInstalledIds,
  uninstallApp,
} from "../registry";
import "./AppStoreApp.scss";

export default function AppStoreApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.appstore);
  const [installed, setInstalled] = useState(loadInstalledIds);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");

  useEffect(() => {
    const sync = () => setInstalled(loadInstalledIds());
    window.addEventListener("nxg-apps-installed", sync);
    return () => window.removeEventListener("nxg-apps-installed", sync);
  }, []);

  useEffect(() => {
    if (open) setInstalled(loadInstalledIds());
  }, [open]);

  const categories = useMemo(() => {
    const set = new Set(FULL_APP_CATALOG.map((a) => a.category));
    return ["Tous", ...Array.from(set)];
  }, []);

  const apps = useMemo(() => {
    return FULL_APP_CATALOG.filter((a) => {
      if (category !== "Tous" && a.category !== category) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.blurb.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const syncDockAfterInstall = (id: string) => {
    const meta = FULL_APP_CATALOG.find((a) => a.id === id);
    if (!meta) return;
    if (!state.dockApps.some((a: { id: string }) => a.id === id)) {
      dispatch({
        type: "dock/ADD",
        payload: { id: meta.id, name: meta.name, icon: meta.icon },
      });
    }
  };

  const syncDockAfterUninstall = (id: string) => {
    dispatch({ type: "dock/REMOVE", payload: id });
    dispatch({ type: "desktop/REMOVE_ICON", payload: id });
    dispatch({ type: "apps/CLOSE", payload: id });
  };

  const onInstall = (id: string) => {
    setInstalled(installApp(id));
    syncDockAfterInstall(id);
    window.dispatchEvent(
      new CustomEvent("nxg-toast", {
        detail: { message: `« ${FULL_APP_CATALOG.find((a) => a.id === id)?.name} » installée` },
      })
    );
  };

  const onUninstall = (id: string) => {
    const meta = FULL_APP_CATALOG.find((a) => a.id === id);
    if (!meta || meta.system) return;
    if (!window.confirm(`Désinstaller ${meta.name} ?`)) return;
    setInstalled(uninstallApp(id));
    syncDockAfterUninstall(id);
    window.dispatchEvent(
      new CustomEvent("nxg-toast", {
        detail: { message: `« ${meta.name} » désinstallée` },
      })
    );
  };

  const onOpen = (id: string) => {
    dispatch({ type: "apps/OPEN", payload: id });
    dispatch({ type: "onTop/SET", payload: id });
  };

  if (!open) return null;
  const closeApp = () =>
    dispatch({ type: "apps/CLOSE", payload: "appstore" });

  return (
    <AppWindowShell
      appId="appstore"
      handle=".store-titlebar"
      defaultPosition={{ x: 110, y: 50 }}
      windowClassName="appstore-window"
      windowId="appstore-window"
    >
      <div
        className="store-hit"
        onMouseDown={() =>
          dispatch({ type: "onTop/SET", payload: "appstore" })
        }
      >
        <header className="store-titlebar">
          <TrafficLights appId="appstore" onClose={closeApp} />
          <div className="store-title">App Store</div>
        </header>
        <div className="store-toolbar">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une app…"
          />
          <div className="store-cats">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={category === c ? "on" : ""}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="store-grid">
          {apps.map((app) => {
            const on = isAppInstalled(app.id, installed);
            return (
              <article key={app.id} className="store-card">
                <img
                  src={require(`../../assets/images/webp/${app.icon}`)}
                  alt=""
                  draggable={false}
                />
                <div className="store-card-meta">
                  <h3>{app.name}</h3>
                  <p>{app.blurb}</p>
                  <div className="store-card-foot">
                    <span>
                      {app.category} · {app.sizeLabel}
                    </span>
                    {app.system ? (
                      <button type="button" onClick={() => onOpen(app.id)}>
                        Ouvrir
                      </button>
                    ) : on ? (
                      <div className="store-actions">
                        <button type="button" onClick={() => onOpen(app.id)}>
                          Ouvrir
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => onUninstall(app.id)}
                        >
                          Retirer
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="install"
                        onClick={() => onInstall(app.id)}
                      >
                        Obtenir
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppWindowShell>
  );
}
