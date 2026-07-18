import React, { useContext } from "react";
import { store } from "../../App";
import "./ControlCenter.scss";
import { ReactComponent as Animations } from "../../assets/images/svg/animations.svg";
import { ReactComponent as Airdrop } from "../../assets/images/svg/airdrop.svg";
import { ReactComponent as Tick } from "../../assets/images/svg/tick.svg";
import { ReactComponent as Notch } from "../../assets/images/svg/notch.svg";
import toggleWallpaperVis from "../../utils/helpers/toggleWallpaperVis";
import { resolveBundledPreview } from "../../utils/helpers/applyWallpaper";
import returnColor, {
  normalizeAccentId,
} from "../../utils/helpers/returnColor";
import updateSysColor from "../../utils/helpers/updateSysColor";
import { ACCENT_COLORS, AccentId } from "../../apps/parametres/settingsMeta";

const CC_ACCENTS: AccentId[] = [
  "orange",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
  "yellow",
  "graphite",
];

export default function ControlCenter() {
  const [state, dispatch] = useContext(store);
  const accent = normalizeAccentId(
    state.settings.prefs?.accent || state.settings.color || "blue"
  );

  const setSystemColor = (id: AccentId) => {
    dispatch({ type: "prefs/PATCH", payload: { accent: id } });
    dispatch({ type: "settings/SETCOLOR", payload: id });
    updateSysColor(id);
    document.documentElement.style.setProperty(
      "--nxg-accent",
      ACCENT_COLORS[id]
    );
    document.documentElement.style.setProperty(
      "--user-color",
      ACCENT_COLORS[id]
    );
  };

  const toggleAnimations = () => {
    dispatch({ type: "settings/ANIMATIONS" });
  };

  const toggleAirdrop = () => {
    dispatch({ type: "settings/AIRDROP" });
  };

  const toggleNotch = () => {
    dispatch({ type: "settings/NOTCH" });
  };

  const openWallpaperWindow = (e: React.MouseEvent) => {
    if (state.settings.wallpaper.open) {
      toggleWallpaperVis(e);
    }
    dispatch({ type: "wallpaper/TOGGLE" });
  };

  const openParametres = (section?: string) => {
    dispatch({ type: "apps/OPEN", payload: "parametres" });
    dispatch({ type: "settings/CLOSE" });
    if (section) {
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("nxg-parametres-section", { detail: section })
        );
      }, 40);
    }
  };

  return (
    <div
      className={`settings-dropdown set ${
        state.settings.open ? "settings-open" : "settings-closed"
      }`}
    >
      <section className="functions set">
        <div className="func set" onClick={toggleAirdrop}>
          <button
            className="airdrop-btn set"
            type="button"
            style={{
              backgroundColor: !state.settings.airdrop
                ? "#2f3541"
                : returnColor(accent),
            }}
          >
            <Airdrop
              fill={state.settings.airdrop ? "black" : "white"}
              style={{ transition: "0.25s all" }}
            />
          </button>
          Partage NXG
        </div>

        <div className="func set" onClick={toggleAnimations}>
          <button
            className="set"
            type="button"
            style={{
              backgroundColor: !state.settings.animations
                ? "#2f3541"
                : returnColor(accent),
            }}
          >
            <Animations
              fill={state.settings.animations ? "black" : "white"}
              style={{ transition: "0.25s all" }}
            />
          </button>
          Animations
        </div>
      </section>

      <section className="sys-colors set">
        Couleur système
        <div className="colors set">
          {CC_ACCENTS.map((id) => (
            <div
              key={id}
              className={`color set accent-${id}`}
              style={{ backgroundColor: ACCENT_COLORS[id] }}
              onClick={() => setSystemColor(id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSystemColor(id);
              }}
            >
              {accent === id ? <Tick /> : null}
            </div>
          ))}
        </div>
      </section>

      <section
        className="wallpaper-container"
        id="opener"
        onClick={openWallpaperWindow}
      >
        <img
          alt="Aperçu fond d’écran"
          className="preview"
          src={
            state.settings.wallpaper.custom
              ? state.settings.wallpaper.src || state.settings.wallpaper.preview
              : resolveBundledPreview(state.settings.wallpaper.surname)
          }
        />
        <div className="desc">
          <h2 className="title">{state.settings.wallpaper.name}</h2>
          <h3 className="type">
            {state.settings.wallpaper.custom
              ? "Fond personnalisé"
              : "Fond dynamique"}
          </h3>
        </div>
      </section>

      <section
        className="notch-container set"
        onClick={toggleNotch}
        onContextMenu={(e) => {
          e.preventDefault();
          openParametres("apparence");
        }}
      >
        <button
          className="notch-btn set"
          type="button"
          style={{
            backgroundColor: !state.settings.notch
              ? "#2f3541"
              : returnColor(accent),
          }}
        >
          <Notch
            fill={state.settings.notch ? "black" : "white"}
            style={{ transition: "0.25s all" }}
          />
        </button>
        Encoche
      </section>

      <button
        type="button"
        className="cc-open-settings"
        onClick={() => openParametres()}
      >
        Ouvrir Paramètres…
      </button>
    </div>
  );
}
