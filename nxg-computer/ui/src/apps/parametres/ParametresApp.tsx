import React, { useContext, useMemo, useRef, useState } from "react";
import Draggable from "react-draggable";
import { store } from "../../App";
import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import { ReactComponent as Minimize } from "../../assets/images/svg/minimize.svg";
import { ReactComponent as Stretch } from "../../assets/images/svg/stretch.svg";
import wallpapers from "../../utils/helpers/wallpapers";
import {
  applyWallpaperToPage,
  fileToWallpaperDataUrl,
  resolveBundledPreview,
  resolveBundledWallpaper,
} from "../../utils/helpers/applyWallpaper";
import updateSysColor from "../../utils/helpers/updateSysColor";
import { APP_CATALOG, DockApp } from "../../desktop/Dock/dockApps";
import {
  ACCENT_COLORS,
  AccentId,
  DockIconSize,
  DockPosition,
  NotificationAppId,
  PermissionId,
  SettingsSectionId,
  STORAGE_USAGE,
  ThemeMode,
  TOTAL_STORAGE_GB,
} from "./settingsMeta";
import "./ParametresApp.scss";

const SECTIONS: { id: SettingsSectionId; label: string; icon: string }[] = [
  { id: "apparence", label: "Apparence", icon: "🎨" },
  { id: "compte", label: "Compte", icon: "👤" },
  { id: "reseau", label: "Réseau", icon: "📡" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "dock", label: "Dock & Bureau", icon: "⬜" },
  { id: "stockage", label: "Stockage", icon: "💾" },
  { id: "confidentialite", label: "Confidentialité", icon: "🔒" },
  { id: "apropos", label: "À propos", icon: "ℹ️" },
];

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
  const [section, setSection] = useState<SettingsSectionId>("apparence");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const wallRef = useRef<HTMLInputElement>(null);
  const prefs = state.settings.prefs;

  const open = Boolean(state.openApps?.parametres);

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
    dispatch({ type: "dock/ADD", payload: app });
  };

  const unpinApp = (id: string) => {
    if (state.dockApps.length <= 1) {
      showToast("Garde au moins une app dans le Dock");
      return;
    }
    dispatch({ type: "dock/REMOVE", payload: id });
  };

  const clearCache = () => {
    patchPrefs({ cacheClearedAt: Date.now() });
    showToast("Cache vidé");
  };

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter((s) => s.label.toLowerCase().includes(q));
  }, [search]);

  const usedMb = STORAGE_USAGE.reduce((a, b) => a + b.mb, 0);
  const usedPct = Math.min(100, (usedMb / (TOTAL_STORAGE_GB * 1024)) * 100);

  const wallPreview = state.settings.wallpaper.custom
    ? state.settings.wallpaper.src
    : state.settings.wallpaper.name === "Catalina"
    ? require("../../assets/images/catalina_day.jpg")
    : resolveBundledWallpaper(state.settings.wallpaper.surname);

  if (!open) return null;

  return (
    <Draggable handle=".parametres-titlebar" bounds="parent">
      <div className="parametres-window" id="parametres-window">
        <header className="parametres-titlebar">
          <div className="parametres-dots">
            <button
              type="button"
              className="dot red"
              onClick={() =>
                dispatch({ type: "apps/CLOSE", payload: "parametres" })
              }
            >
              <Close className="ico" />
            </button>
            <button type="button" className="dot yellow">
              <Minimize className="ico" />
            </button>
            <button type="button" className="dot green">
              <Stretch className="ico" />
            </button>
          </div>
          <div className="parametres-title">Paramètres</div>
        </header>

        <div className="parametres-body">
          <aside className="parametres-sidebar">
            <input
              className="parametres-search"
              placeholder="Rechercher"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                  <span className="parametres-nav-ico">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="parametres-content">
            {section === "apparence" && (
              <div className="ps-pane">
                <h1>Apparence</h1>
                <section className="ps-card">
                  <h2>Fond d’écran</h2>
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

                <section className="ps-card">
                  <h2>Thème</h2>
                  <Segmented<ThemeMode>
                    value={prefs.theme}
                    onChange={(theme) => patchPrefs({ theme })}
                    options={[
                      { id: "light", label: "Clair" },
                      { id: "dark", label: "Sombre" },
                      { id: "auto", label: "Auto" },
                    ]}
                  />
                </section>

                <section className="ps-card">
                  <h2>Taille des icônes du Dock</h2>
                  <Segmented<DockIconSize>
                    value={prefs.dockIconSize}
                    onChange={(dockIconSize) => patchPrefs({ dockIconSize })}
                    options={[
                      { id: "small", label: "Petit" },
                      { id: "medium", label: "Moyen" },
                      { id: "large", label: "Grand" },
                    ]}
                  />
                </section>

                <section className="ps-card">
                  <h2>Position du Dock</h2>
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
                </section>

                <section className="ps-card">
                  <h2>Couleur d’accent</h2>
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
                <h1>Compte / Profil</h1>
                <section className="ps-card ps-profile">
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

                <section className="ps-card">
                  <h2>Verrouillage de session</h2>
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
                    hint="Touch ID est une simulation visuelle"
                  >
                    <Segmented<"password" | "touchid">
                      value={prefs.lockMethod}
                      onChange={(lockMethod) => patchPrefs({ lockMethod })}
                      options={[
                        { id: "password", label: "Code" },
                        { id: "touchid", label: "Touch ID" },
                      ]}
                    />
                  </Row>
                </section>
              </div>
            )}

            {section === "reseau" && (
              <div className="ps-pane">
                <h1>Réseau / Général</h1>
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
                  <Row label="Langue">
                    <select
                      className="ps-select"
                      value={prefs.language}
                      onChange={(e) =>
                        patchPrefs({ language: e.target.value })
                      }
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </Row>
                  <Row
                    label="Date et heure"
                    hint="Synchronisé avec le serveur"
                  >
                    <span className="ps-mono">
                      {new Date().toLocaleString(
                        prefs.language === "en" ? "en-GB" : "fr-FR"
                      )}
                    </span>
                  </Row>
                </section>
              </div>
            )}

            {section === "notifications" && (
              <div className="ps-pane">
                <h1>Notifications</h1>
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
                <h1>Dock et Bureau</h1>
                <section className="ps-card">
                  <h2>Apps épinglées</h2>
                  <p className="ps-hint">
                    Réorganise aussi par glisser-déposer directement dans le
                    Dock.
                  </p>
                  <div className="ps-app-list">
                    {APP_CATALOG.map((app) => {
                      const pinned = state.dockApps.some((d) => d.id === app.id);
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
                <h1>Stockage</h1>
                <section className="ps-card">
                  <div className="ps-storage-head">
                    <strong>
                      {(usedMb / 1024).toFixed(1)} Go
                    </strong>{" "}
                    sur {TOTAL_STORAGE_GB} Go
                  </div>
                  <div className="ps-storage-bar">
                    <div style={{ width: `${usedPct}%` }} />
                  </div>
                  <div className="ps-storage-list">
                    {STORAGE_USAGE.map((item) => (
                      <div key={item.id} className="ps-storage-row">
                        <span>{item.label}</span>
                        <span>
                          {item.mb >= 1024
                            ? `${(item.mb / 1024).toFixed(1)} Go`
                            : `${item.mb} Mo`}
                        </span>
                      </div>
                    ))}
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
                <h1>Confidentialité / Sécurité</h1>
                <section className="ps-card">
                  <h2>Permissions</h2>
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
                <section className="ps-card">
                  <Row
                    label="Verrouillage auto"
                    hint="Après inactivité"
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
                      <option value={1}>1 minute</option>
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={0}>Jamais</option>
                    </select>
                  </Row>
                </section>
              </div>
            )}

            {section === "apropos" && (
              <div className="ps-pane">
                <h1>À propos</h1>
                <section className="ps-card ps-about">
                  <div className="ps-about-logo">NXG</div>
                  <h2>NXG Computer</h2>
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
    </Draggable>
  );
}
