import React, { useContext, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import { store } from "../../App";
import "./WallpaperWindow.scss";
import wallpapers from "../../utils/helpers/wallpapers";
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
  const nodeRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallpaper = state.settings.wallpaper;
  const isCustom = Boolean(wallpaper.custom);

  useEffect(() => {
    if (!wallpaper.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dispatch({ type: "wallpaper/CLOSE" });
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [wallpaper.open, dispatch]);

  if (!wallpaper.open) return null;

  const currentPreview = isCustom
    ? wallpaper.src || wallpaper.preview
    : wallpaper.surname === "catalina"
    ? require("../../assets/images/catalina_day.jpg")
    : resolveBundledWallpaper(wallpaper.surname);

  const closeWindow = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    dispatch({ type: "wallpaper/CLOSE" });
  };

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
      nodeRef={nodeRef}
      handle=".wallpaper-handle"
      cancel="button,input,.wp-dot"
      bounds="parent"
      defaultPosition={{ x: 180, y: 80 }}
    >
      <div
        ref={nodeRef}
        className="wallpaper-menu wallp"
        id="wallpaper-menu"
      >
        <header className="wallpaper-handle">
          <div className="wp-traffic" role="toolbar" aria-label="Fenêtre">
            <button
              type="button"
              className="wp-dot red"
              aria-label="Fermer"
              onClick={closeWindow}
              onPointerDown={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              className="wp-dot yellow"
              aria-label="Réduire"
              onClick={closeWindow}
              onPointerDown={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              className="wp-dot green"
              aria-label="Plein écran"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
          <span className="wallpaper-title">Fond d&apos;écran</span>
        </header>

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
    </Draggable>
  );
}
