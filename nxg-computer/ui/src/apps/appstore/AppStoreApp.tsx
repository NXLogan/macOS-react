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
import { useT } from "../../i18n/useT";
import "./AppStoreApp.scss";

const CAT_KEY: Record<string, string> = {
  Système: "apps.cat.system",
  Utilitaires: "apps.cat.utilities",
  Productivité: "apps.cat.productivity",
  Créativité: "apps.cat.creativity",
  Internet: "apps.cat.internet",
  Divertissement: "apps.cat.entertainment",
  Développeur: "apps.cat.developer",
  Navigation: "apps.cat.navigation",
};

export default function AppStoreApp() {
  const [state, dispatch] = useContext(store);
  const t = useT();
  const open = Boolean(state.openApps?.appstore);
  const [installed, setInstalled] = useState(loadInstalledIds);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("__all__");

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
    return ["__all__", ...Array.from(set)];
  }, []);

  const localizeApp = (id: string, fallback: string, kind: "name" | "blurb") => {
    const key = `apps.${id}.${kind}`;
    const v = t(key);
    return v.startsWith("apps.") ? fallback : v;
  };

  const localizeCat = (cat: string) => {
    if (cat === "__all__") return t("apps.cat.all");
    const key = CAT_KEY[cat];
    return key ? t(key) : cat;
  };

  const apps = useMemo(() => {
    return FULL_APP_CATALOG.filter((a) => {
      if (category !== "__all__" && a.category !== category) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const name = localizeApp(a.id, a.name, "name").toLowerCase();
      const blurb = localizeApp(a.id, a.blurb, "blurb").toLowerCase();
      const cat = localizeCat(a.category).toLowerCase();
      return name.includes(q) || blurb.includes(q) || cat.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, t]);

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
        detail: {
          message: t("toast.installed", {
            name: localizeApp(id, id, "name"),
          }),
        },
      })
    );
  };

  const onUninstall = (id: string) => {
    const meta = FULL_APP_CATALOG.find((a) => a.id === id);
    if (!meta || meta.system) return;
    const name = localizeApp(id, meta.name, "name");
    if (!window.confirm(`${t("common.uninstall")} ${name}?`)) return;
    setInstalled(uninstallApp(id));
    syncDockAfterUninstall(id);
    window.dispatchEvent(
      new CustomEvent("nxg-toast", {
        detail: { message: t("toast.uninstalled", { name }) },
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
          <div className="store-title">{t("apps.appstore.name")}</div>
        </header>
        <div className="store-toolbar">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("store.search")}
          />
          <div className="store-cats">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={category === c ? "on" : ""}
                onClick={() => setCategory(c)}
              >
                {localizeCat(c)}
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
                  <h3>{localizeApp(app.id, app.name, "name")}</h3>
                  <p>{localizeApp(app.id, app.blurb, "blurb")}</p>
                  <div className="store-card-foot">
                    <span>
                      {localizeCat(app.category)} · {app.sizeLabel}
                    </span>
                    {app.system ? (
                      <button type="button" onClick={() => onOpen(app.id)}>
                        {t("common.open")}
                      </button>
                    ) : on ? (
                      <div className="store-actions">
                        <button type="button" onClick={() => onOpen(app.id)}>
                          {t("common.open")}
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => onUninstall(app.id)}
                        >
                          {t("common.uninstall")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="install"
                        onClick={() => onInstall(app.id)}
                      >
                        {t("store.get")}
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
