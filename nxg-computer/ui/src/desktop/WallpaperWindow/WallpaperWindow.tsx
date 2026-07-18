import React, { useContext, useRef, useState } from "react";
import Draggable from "react-draggable";
import { store } from "../../App";
import "./WallpaperWindow.scss";
import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import { ReactComponent as Minimize } from "../../assets/images/svg/minimize.svg";
import { ReactComponent as Stretch } from "../../assets/images/svg/stretch.svg";
import wallpapers from "../../utils/helpers/wallpapers";
import toggleWallpaperVis from "../../utils/helpers/toggleWallpaperVis";
import toggleWallpaperMin from "../../utils/helpers/toggleWallpaperMin";
import wallpaperObjectType from "../../store/types/wallpaperObjectType";
import returnColor from "../../utils/helpers/returnColor";
import toggleBorder from "../../utils/helpers/toggleBorder";
import {
  applyWallpaperToPage,
  fileToWallpaperDataUrl,
  resolveBundledPreview,
  resolveBundledWallpaper,
} from "../../utils/helpers/applyWallpaper";

export default function WallpaperWindow() {
  const [state, dispatch] = useContext(store);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallpaper = state.settings.wallpaper;
  const isCustom = Boolean(wallpaper.custom);

  const currentPreview = isCustom
    ? wallpaper.src || wallpaper.preview
    : wallpaper.surname === "catalina"
    ? require("../../assets/images/catalina_day.jpg")
    : resolveBundledWallpaper(wallpaper.surname);

  const changeWallpaper = (item: wallpaperObjectType) => {
    setError(null);
    const url = resolveBundledWallpaper(item.surname);
    dispatch({
      type: "wallpaper/CHANGE",
      payload: {
        name: item.name,
        surname: item.surname,
        preview: `../../assets/images/preview_${item.surname}.jpg`,
        src: `../../assets/images/${item.surname}.jpg`,
        custom: false,
      },
    });
    applyWallpaperToPage(url);
  };

  const onPickCustom = () => {
    setError(null);
    fileRef.current?.click();
  };

  const onCustomFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choisis une image (JPG, PNG, WebP…).");
      return;
    }

    setImporting(true);
    setError(null);
    try {
      const dataUrl = await fileToWallpaperDataUrl(file);
      const name =
        file.name.replace(/\.[^.]+$/, "").trim() || "Personnalisé";

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
    } catch {
      setError("Impossible d’importer cette image.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Draggable
      handle="#wallpaper-handle"
      onStart={(e: any) => {
        if (e.target.id !== "wallpaper-handle") {
          return false;
        }
      }}
    >
      {wallpaper.open ? (
        <div className="wallpaper-menu wallp" id="wallpaper-menu">
          <section className="handle" id="wallpaper-handle">
            <div className="dots">
              <div className="dot red" onClick={toggleWallpaperVis}>
                <Close className="close" />
              </div>
              <div className="dot yellow" onClick={toggleWallpaperMin}>
                <Minimize className="minimize" />
              </div>
              <div className="dot green">
                <Stretch className="stretch" />
              </div>
            </div>
            Fond d&apos;écran
          </section>

          <section className="selection">
            <div className="prev">
              <img
                alt="Fond d'écran actuel"
                className="current"
                src={currentPreview}
              />
              <h1>{wallpaper.name}</h1>
              <h2>{isCustom ? "Fond personnalisé" : "Fond dynamique"}</h2>

              <div className="custom-import">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onCustomFile}
                />
                <button
                  type="button"
                  className="custom-import-btn"
                  onClick={onPickCustom}
                  disabled={importing}
                >
                  {importing ? "Import…" : "Importer une image…"}
                </button>
                {error ? <p className="custom-import-error">{error}</p> : null}
              </div>
            </div>

            <div className="wallpaper-selector">
              <h1>Fonds d&apos;écran</h1>

              <div className="grid">
                {isCustom && wallpaper.src ? (
                  <div className="item-container">
                    <img
                      alt="Personnalisé"
                      className="image-wrapper is-selected"
                      src={wallpaper.src}
                      style={{
                        borderColor: returnColor(state.settings.color),
                      }}
                    />
                    <h2>Personnalisé</h2>
                  </div>
                ) : null}

                {wallpapers.map(
                  (wallpaperObject: wallpaperObjectType, i: number) => {
                    const selected =
                      !isCustom && wallpaper.surname === wallpaperObject.surname;
                    return (
                      <div className="item-container" key={i}>
                        <img
                          alt={wallpaperObject.name}
                          className={`image-wrapper${
                            selected ? " is-selected" : ""
                          }`}
                          onMouseEnter={toggleBorder}
                          onMouseLeave={toggleBorder}
                          src={resolveBundledPreview(wallpaperObject.surname)}
                          onClick={() => changeWallpaper(wallpaperObject)}
                          style={{
                            borderColor: returnColor(state.settings.color),
                          }}
                        />
                        <h2>{wallpaperObject.name}</h2>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div />
      )}
    </Draggable>
  );
}
