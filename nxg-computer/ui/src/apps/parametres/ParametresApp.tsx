import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import wallpapers from "../../utils/helpers/wallpapers";

import {
  applyWallpaperToPage,
  fileToWallpaperDataUrl,
  resolveBundledPreview,
  resolveBundledWallpaper,
} from "../../utils/helpers/applyWallpaper";
import updateSysColor from "../../utils/helpers/updateSysColor";
import { APP_CATALOG, DockApp } from "../../desktop/Dock/dockApps";
import { pinAppToDock, unpinAppFromDock } from "../../desktop/Dock/dockPin";
import { isAppInstalled, loadInstalledIds } from "../registry";
import clearStorage from "../../utils/helpers/clearStorage";
import {
  computeStorageBreakdown,
  totalStorageBytes,
} from "../fichiers/fsApi";
import {
  ACCENT_COLORS,
  AccentId,
  DockIconSize,
  DockPosition,
  NotificationAppId,
  PermissionId,
  SettingsSectionId,
  ThemeMode,
  TOTAL_STORAGE_GB,
} from "./settingsMeta";
import { LOCALES, localeTag } from "../../i18n";
import { useT } from "../../i18n/useT";
import "./ParametresApp.scss";

const SECTION_META: {
  id: SettingsSectionId;
  labelKey: string;
  icon: string;
  color: string;
}[] = [
  { id: "apparence", labelKey: "settings.apparence", icon: "🎨", color: "#bf5af2" },
  { id: "compte", labelKey: "settings.compte", icon: "👤", color: "#64d2ff" },
  { id: "reseau", labelKey: "settings.reseau", icon: "📡", color: "#0a84ff" },
  { id: "notifications", labelKey: "settings.notifications", icon: "🔔", color: "#ff453a" },
  { id: "dock", labelKey: "settings.dock", icon: "⬜", color: "#8e8e93" },
  { id: "stockage", labelKey: "settings.stockage", icon: "💾", color: "#30d158" },
  {
    id: "confidentialite",
    labelKey: "settings.confidentialite",
    icon: "🔒",
    color: "#ff9f0a",
  },
  { id: "apropos", labelKey: "settings.apropos", icon: "ℹ️", color: "#5e5ce6" },
];

function PaneHead({
  sectionId,
  title,
}: {
  sectionId: SettingsSectionId;
  title: string;
}) {
  const meta = SECTION_META.find((s) => s.id === sectionId);
  return (
    <div className="ps-pane-head">
      <div
        className="ps-pane-icon"
        style={{ background: meta?.color ?? "#0a84ff" }}
      >
        {meta?.icon ?? "⚙️"}
      </div>
      <h1>{title}</h1>
    </div>
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`ps-toggle ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="ps-toggle-knob" />
    </button>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ps-row">
      <div className="ps-row-text">
        <div className="ps-row-label">{label}</div>
        {hint ? <div className="ps-row-hint">{hint}</div> : null}
      </div>
      <div className="ps-row-control">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="ps-segmented">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={value === o.id ? "active" : ""}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ParametresApp() {
  const [state, dispatch] = useContext(store);
  const t = useT();
  const [section, setSection] = useState<SettingsSectionId>("apparence");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const wallRef = useRef<HTMLInputElement>(null);
  const prefs = state.settings.prefs;

  const SECTIONS = useMemo(
    () =>
      SECTION_META.map((s) => ({
        ...s,
        label: t(s.labelKey),
      })),
    [t]
  );

  const open = Boolean(state.openApps?.parametres);

  useEffect(() => {
    const onSec = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (typeof id === "string") setSection(id as SettingsSectionId);
    };
    window.addEventListener("nxg-parametres-section", onSec);
    return () => window.removeEventListener("nxg-parametres-section", onSec);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const patchPrefs = (payload: Partial<typeof prefs>) => {
    dispatch({ type: "prefs/PATCH", payload });
  };

  const setAccent = (accent: AccentId) => {
    patchPrefs({ accent });
    dispatch({ type: "settings/SETCOLOR", payload: accent });
    updateSysColor(accent);
    document.documentElement.style.setProperty(
      "--nxg-accent",
      ACCENT_COLORS[accent]
    );
    document.documentElement.style.setProperty(
      "--user-color",
      ACCENT_COLORS[accent]
    );
  };

  const changeWallpaper = (surname: string, name: string) => {
    const url = resolveBundledWallpaper(surname);
    dispatch({
      type: "wallpaper/CHANGE",
      payload: {
        name,
        surname,
        preview: `../../assets/images/preview_${surname}.jpg`,
        src: `../../assets/images/${surname}.jpg`,
        custom: false,
      },
    });
    applyWallpaperToPage(url);
  };

  const onCustomWallpaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const dataUrl = await fileToWallpaperDataUrl(file);
      const name = file.name.replace(/\.[^.]+$/, "") || "Personnalisé";
      dispatch({
        type: "wallpaper/CHANGE",
        payload: {
          name,
          surname: "custom",
          preview: dataUrl,
          src: dataUrl,
          custom: true,
        },
      });
      applyWallpaperToPage(dataUrl);
      showToast("Fond d’écran importé");
    } catch {
      showToast("Import impossible");
    }
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const dataUrl = await fileToWallpaperDataUrl(file, 256, 0.88);
      dispatch({ type: "user/UPDATE", payload: { avatar: dataUrl } });
    } catch {
      showToast("Photo invalide");
    }
  };

  const pinApp = (app: DockApp) => {
    pinAppToDock(dispatch, state, app);
    showToast(`${app.name} dans la barre`);
  };

  const unpinApp = (id: string) => {
    const result = unpinAppFromDock(dispatch, state, id);
    if (!result.ok) {
      showToast(result.reason || "Impossible");
      return;
    }
    showToast("Retiré de la barre — placé sur le Bureau");
  };

  const clearCache = () => {
    if (
      !window.confirm(
        "Vider le cache local ?\n\nLes données de ce PC seront réinitialisées après rechargement."
      )
    ) {
      return;
    }
    clearStorage();
  };

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter((s) => s.label.toLowerCase().includes(q));
  }, [search, SECTIONS]);

  const [storageTick, setStorageTick] = useState(0);
  useEffect(() => {
    const bump = () => setStorageTick((n) => n + 1);
    window.addEventListener("nxg-fs-changed", bump);
    window.addEventListener("nxg-memory-hydrated", bump);
    return () => {
      window.removeEventListener("nxg-fs-changed", bump);
      window.removeEventListener("nxg-memory-hydrated", bump);
    };
  }, []);

  const storageBuckets = useMemo(() => {
    void storageTick;
    return computeStorageBreakdown();
  }, [storageTick]);

  const usedBytes = useMemo(
    () => totalStorageBytes(storageBuckets),
    [storageBuckets]
  );
  const usedMb = usedBytes / (1024 * 1024);
  const usedPct = Math.min(100, (usedMb / (TOTAL_STORAGE_GB * 1024)) * 100);

  const wallPreview = state.settings.wallpaper.custom
    ? state.settings.wallpaper.src
    : state.settings.wallpaper.surname === "catalina"
    ? require("../../assets/images/catalina_day.jpg")
    : resolveBundledWallpaper(state.settings.wallpaper.surname);

  if (!open) return null;

  return (
    <AppWindowShell
      appId="parametres"
      handle=".parametres-titlebar"
      defaultPosition={{ x: 0, y: 0 }}
      windowClassName="parametres-window"
      windowId="parametres-window"
    >
        <div
          className="parametres-window-hit"
          onMouseDown={() =>
            dispatch({ type: "onTop/SET", payload: "parametres" })
          }
        >
        <header className="parametres-titlebar">
          <TrafficLights appId="parametres" />
          <div className="parametres-title">Paramètres</div>
        </header>

        <div className="parametres-body">
          <aside className="parametres-sidebar">
            <div className="parametres-search-wrap">
              <span className="parametres-search-ico">⌕</span>
              <input
                className="parametres-search"
                placeholder="Rechercher"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className={`parametres-user ${
                section === "compte" ? "active" : ""
              }`}
              onClick={() => setSection("compte")}
            >
              <div className="parametres-user-avatar">
                {state.user.avatar ? (
                  <img src={state.user.avatar} alt="" />
                ) : (
                  (state.user.name || "N").charAt(0).toUpperCase()
                )}
              </div>
              <div className="parametres-user-meta">
                <div className="parametres-user-name">
                  {state.user.name || "Utilisateur"}
                </div>
                <div className="parametres-user-sub">Compte NXGos</div>
              </div>
            </button>

            <nav>
              {filteredSections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`parametres-nav ${
                    section === s.id ? "active" : ""
                  }`}
                  onClick={() => setSection(s.id)}
                >
                  <span
                    className="parametres-nav-badge"
                    style={{ background: s.color }}
                  >
                    {s.icon}
                  </span>
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="parametres-content">
            {section === "apparence" && (
              <div className="ps-pane">
                <PaneHead sectionId="apparence" title={t("settings.apparence")} />
                <h2>Fond d’écran</h2>
                <section className="ps-card ps-card-pad">
                  <img className="ps-wall-preview" src={wallPreview} alt="" />
                  <div className="ps-wall-grid">
                    {wallpapers.map((w: { surname: string; name: string }) => (
                      <button
                        key={w.surname}
                        type="button"
                        className={`ps-wall-item ${
                          !state.settings.wallpaper.custom &&
                          state.settings.wallpaper.surname === w.surname
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => changeWallpaper(w.surname, w.name)}
                      >
                        <img
                          src={resolveBundledPreview(w.surname)}
                          alt={w.name}
                        />
                        <span>{w.name}</span>
                      </button>
                    ))}
                  </div>
                  <input
                    ref={wallRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onCustomWallpaper}
                  />
                  <button
                    type="button"
                    className="ps-btn"
                    onClick={() => wallRef.current?.click()}
                  >
                    Importer une image…
                  </button>
                </section>

                <h2>Thème</h2>
                <section className="ps-card">
                  <Row label="Apparence">
                    <Segmented<ThemeMode>
                      value={prefs.theme}
                      onChange={(theme) => patchPrefs({ theme })}
                      options={[
                        { id: "light", label: "Clair" },
                        { id: "dark", label: "Sombre" },
                        { id: "auto", label: "Auto" },
                      ]}
                    />
                  </Row>
                </section>

                <h2>Barre d’apps</h2>
                <section className="ps-card">
                  <Row label="Taille des icônes">
                    <Segmented<DockIconSize>
                      value={prefs.dockIconSize}
                      onChange={(dockIconSize) => patchPrefs({ dockIconSize })}
                      options={[
                        { id: "small", label: "Petit" },
                        { id: "medium", label: "Moyen" },
                        { id: "large", label: "Grand" },
                      ]}
                    />
                  </Row>
                  <Row label="Position">
                    <Segmented<DockPosition>
                      value={prefs.dockPosition}
                      onChange={(dockPosition) => patchPrefs({ dockPosition })}
                      options={[
                        { id: "bottom", label: "Bas" },
                        { id: "left", label: "Gauche" },
                        { id: "right", label: "Droite" },
                        { id: "hidden", label: "Masqué" },
                      ]}
                    />
                  </Row>
                </section>

                <h2>Couleur d’accent</h2>
                <section className="ps-card ps-card-pad">
                  <div className="ps-accents">
                    {(Object.keys(ACCENT_COLORS) as AccentId[]).map((id) => (
                      <button
                        key={id}
                        type="button"
                        className={`ps-accent ${
                          prefs.accent === id ? "selected" : ""
                        }`}
                        style={{ background: ACCENT_COLORS[id] }}
                        onClick={() => setAccent(id)}
                        aria-label={id}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {section === "compte" && (
              <div className="ps-pane">
                <PaneHead sectionId="compte" title={t("settings.compte")} />
                <h2>Profil</h2>
                <section className="ps-card ps-card-pad ps-profile">
                  <button
                    type="button"
                    className="ps-avatar"
                    onClick={() => avatarRef.current?.click()}
                  >
                    {state.user.avatar ? (
                      <img src={state.user.avatar} alt="" />
                    ) : (
                      <span>
                        {(state.user.name || "N").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onAvatar}
                  />
                  <div className="ps-profile-fields">
                    <label>
                      Pseudo
                      <input
                        value={state.user.name}
                        onChange={(e) =>
                          dispatch({
                            type: "user/UPDATE",
                            payload: { name: e.target.value },
                          })
                        }
                      />
                    </label>
                    <label>
                      Téléphone lié
                      <input
                        value={state.user.phone || ""}
                        placeholder="Non lié"
                        onChange={(e) =>
                          dispatch({
                            type: "user/UPDATE",
                            payload: { phone: e.target.value },
                          })
                        }
                      />
                    </label>
                  </div>
                </section>

                <h2>Verrouillage de session</h2>
                <section className="ps-card">
                  <Row label="Mot de passe">
                    <input
                      className="ps-input-sm"
                      type="password"
                      value={state.user.password}
                      onChange={(e) =>
                        dispatch({
                          type: "user/UPDATE",
                          payload: { password: e.target.value },
                        })
                      }
                    />
                  </Row>
                  <Row
                    label="Méthode"
                    hint="NXG ID est une simulation visuelle"
                  >
                    <Segmented<"password" | "touchid">
                      value={prefs.lockMethod}
                      onChange={(lockMethod) => patchPrefs({ lockMethod })}
                      options={[
                        { id: "password", label: "Code" },
                        { id: "touchid", label: "NXG ID" },
                      ]}
                    />
                  </Row>
                </section>
              </div>
            )}

            {section === "reseau" && (
              <div className="ps-pane">
                <PaneHead sectionId="reseau" title={t("settings.reseau")} />
                <h2>Connexion</h2>
                <section className="ps-card">
                  <Row label="Wi‑Fi" hint={prefs.wifi ? "NXG_City_5G" : "Off"}>
                    <Toggle
                      on={prefs.wifi}
                      onChange={(wifi) => patchPrefs({ wifi })}
                    />
                  </Row>
                  <Row label="Bluetooth">
                    <Toggle
                      on={prefs.bluetooth}
                      onChange={(bluetooth) => patchPrefs({ bluetooth })}
                    />
                  </Row>
                  <Row label="Nom de l’appareil">
                    <input
                      className="ps-input-sm"
                      value={prefs.deviceName}
                      onChange={(e) =>
                        patchPrefs({ deviceName: e.target.value })
                      }
                    />
                  </Row>
                  <Row label={t("settings.language")}>
                    <select
                      className="ps-select"
                      value={prefs.language}
                      onChange={(e) =>
                        patchPrefs({ language: e.target.value })
                      }
                    >
                      {LOCALES.map((l: { code: string; native: string }) => (
                        <option key={l.code} value={l.code}>
                          {l.native}
                        </option>
                      ))}
                    </select>
                  </Row>
                  <Row
                    label={t("settings.dateTime")}
                    hint={t("settings.dateTimeHint")}
                  >
                    <span className="ps-mono">
                      {new Date().toLocaleString(
                        localeTag(
                          (prefs.language as "fr" | "en" | "ar" | "ru") || "fr"
                        )
                      )}
                    </span>
                  </Row>
                </section>
              </div>
            )}

            {section === "notifications" && (
              <div className="ps-pane">
                <PaneHead sectionId="notifications" title={t("settings.notifications")} />
                <h2>Autorisations</h2>
                <section className="ps-card">
                  {(
                    [
                      ["sms", "SMS / Messages"],
                      ["mail", "Mails"],
                      ["social", "Réseaux sociaux"],
                      ["entreprise", "Entreprise"],
                    ] as [NotificationAppId, string][]
                  ).map(([id, label]) => (
                    <Row key={id} label={label}>
                      <Toggle
                        on={prefs.notifications[id]}
                        onChange={(v) =>
                          patchPrefs({
                            notifications: {
                              ...prefs.notifications,
                              [id]: v,
                            },
                          })
                        }
                      />
                    </Row>
                  ))}
                  <Row label="Son des notifications">
                    <Toggle
                      on={prefs.notificationSound}
                      onChange={(notificationSound) =>
                        patchPrefs({ notificationSound })
                      }
                    />
                  </Row>
                  <Row label="Aperçu sur écran verrouillé">
                    <Toggle
                      on={prefs.lockScreenPreview}
                      onChange={(lockScreenPreview) =>
                        patchPrefs({ lockScreenPreview })
                      }
                    />
                  </Row>
                </section>
              </div>
            )}

            {section === "dock" && (
              <div className="ps-pane">
                <PaneHead sectionId="dock" title={t("settings.dock")} />
                <h2>Apps épinglées</h2>
                <section className="ps-card ps-card-pad">
                  <p className="ps-hint">
                    Réorganise aussi par glisser-déposer directement dans la
                    barre d’apps.
                  </p>
                  <div className="ps-app-list">
                    {APP_CATALOG.filter((app) =>
                      isAppInstalled(app.id, loadInstalledIds())
                    ).map((app) => {
                      const pinned = state.dockApps.some(
                        (d: DockApp) => d.id === app.id
                      );
                      return (
                        <div key={app.id} className="ps-app-row">
                          <img
                            src={require(`../../assets/images/webp/${app.icon}`)}
                            alt=""
                          />
                          <span>{app.name}</span>
                          <button
                            type="button"
                            className="ps-btn ghost"
                            onClick={() =>
                              pinned ? unpinApp(app.id) : pinApp(app)
                            }
                          >
                            {pinned ? "Désépingler" : "Épingler"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <h2>Bureau</h2>
                <section className="ps-card">
                  <Row
                    label="Widgets sur le bureau"
                    hint="Affiche un widget météo cosmétique"
                  >
                    <Toggle
                      on={prefs.widgets}
                      onChange={(widgets) => patchPrefs({ widgets })}
                    />
                  </Row>
                </section>
              </div>
            )}

            {section === "stockage" && (
              <div className="ps-pane">
                <PaneHead sectionId="stockage" title={t("settings.stockage")} />
                <h2>Disque NXG</h2>
                <section className="ps-card ps-card-pad">
                  <div className="ps-storage-head">
                    <strong>{(usedMb / 1024).toFixed(1)} Go</strong> sur{" "}
                    {TOTAL_STORAGE_GB} Go
                  </div>
                  <div className="ps-storage-bar">
                    <div style={{ width: `${usedPct}%` }} />
                  </div>
                  <div className="ps-storage-list">
                    {storageBuckets.map((item) => {
                      const mb = item.bytes / (1024 * 1024);
                      return (
                        <div key={item.id} className="ps-storage-row">
                          <span>{item.label}</span>
                          <span>
                            {mb >= 1024
                              ? `${(mb / 1024).toFixed(1)} Go`
                              : mb >= 1
                              ? `${mb.toFixed(0)} Mo`
                              : `${Math.max(1, Math.round(item.bytes / 1024))} Ko`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" className="ps-btn" onClick={clearCache}>
                    Vider le cache
                  </button>
                  {prefs.cacheClearedAt ? (
                    <p className="ps-hint">
                      Dernier nettoyage :{" "}
                      {new Date(prefs.cacheClearedAt).toLocaleString("fr-FR")}
                    </p>
                  ) : null}
                </section>
              </div>
            )}

            {section === "confidentialite" && (
              <div className="ps-pane">
                <PaneHead
                  sectionId="confidentialite"
                  title={t("settings.confidentialite")}
                />
                <h2>Permissions</h2>
                <section className="ps-card">
                  {(
                    [
                      ["camera", "Caméra"],
                      ["contacts", "Contacts"],
                      ["microphone", "Microphone"],
                      ["location", "Localisation"],
                      ["files", "Fichiers"],
                    ] as [PermissionId, string][]
                  ).map(([id, label]) => (
                    <Row key={id} label={label}>
                      <Toggle
                        on={prefs.permissions[id]}
                        onChange={(v) =>
                          patchPrefs({
                            permissions: {
                              ...prefs.permissions,
                              [id]: v,
                            },
                          })
                        }
                      />
                    </Row>
                  ))}
                </section>
                <h2>Sécurité</h2>
                <section className="ps-card">
                  <Row
                    label={t("settings.sleepShutdown")}
                    hint={t("settings.sleepHint")}
                  >
                    <select
                      className="ps-select"
                      value={prefs.autoLockMinutes}
                      onChange={(e) =>
                        patchPrefs({
                          autoLockMinutes: Number(e.target.value),
                        })
                      }
                    >
                      <option value={1}>{t("settings.minute")}</option>
                      <option value={5}>{t("settings.minutes", { n: 5 })}</option>
                      <option value={10}>{t("settings.minutes", { n: 10 })}</option>
                      <option value={15}>{t("settings.minutes", { n: 15 })}</option>
                      <option value={0}>{t("settings.never")}</option>
                    </select>
                  </Row>
                </section>
              </div>
            )}

            {section === "apropos" && (
              <div className="ps-pane">
                <PaneHead sectionId="apropos" title={t("settings.apropos")} />
                <section className="ps-card ps-about">
                  <div className="ps-about-logo">NXG</div>
                  <h2>NXGos</h2>
                  <p className="ps-mono">Version 1.0.0</p>
                  <div className="ps-about-locked">
                    <div className="ps-about-row">
                      <span>Développeur</span>
                      <strong>NXG</strong>
                    </div>
                    <div className="ps-about-row">
                      <span>Appareil</span>
                      <strong>{prefs.deviceName}</strong>
                    </div>
                    <div className="ps-about-row">
                      <span>Session</span>
                      <strong>
                        {state.session.computerId} · {state.session.userId}
                      </strong>
                    </div>
                    <p className="ps-credits-lock">
                      Crédits développeur verrouillés — NXG
                    </p>
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>

        {toast ? <div className="parametres-toast">{toast}</div> : null}
        </div>
    </AppWindowShell>
  );
}
