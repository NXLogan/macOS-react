import React, { useContext, useMemo, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import wallpapers from "../../utils/helpers/wallpapers";
import "./PhotosApp.scss";

type PhotoItem = {
  id: string;
  name: string;
  src: string;
  album: string;
};

function bundledPhotos(): PhotoItem[] {
  return wallpapers.map((w, i) => {
    let src = "";
    try {
      src = require(`../../assets/images/${w.surname}.jpg`);
    } catch {
      src = "";
    }
    return {
      id: `wp-${i}`,
      name: w.name,
      src,
      album: "Fonds d'écran",
    };
  }).filter((p) => p.src);
}

export default function PhotosApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.photos);
  const [album, setAlbum] = useState("all");
  const [selected, setSelected] = useState<PhotoItem | null>(null);
  const [extra, setExtra] = useState<PhotoItem[]>([]);

  const library = useMemo(() => [...bundledPhotos(), ...extra], [extra]);
  const albums = useMemo(() => {
    const set = new Set(library.map((p) => p.album));
    return Array.from(set);
  }, [library]);

  const visible =
    album === "all" ? library : library.filter((p) => p.album === album);

  const onUpload = (files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setExtra((prev) => [
          {
            id: `up-${Date.now()}-${file.name}`,
            name: file.name,
            src: String(reader.result),
            album: "Importées",
          },
          ...prev,
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  if (!open) return null;
  const closeApp = () => dispatch({ type: "apps/CLOSE", payload: "photos" });

  return (
    <AppWindowShell
      appId="photos"
      handle=".photos-titlebar"
      defaultPosition={{ x: 100, y: 70 }}
      windowClassName="photos-window"
      windowId="photos-window"
    >
      <div
        className="photos-hit"
        onMouseDown={() => dispatch({ type: "onTop/SET", payload: "photos" })}
      >
        <header className="photos-titlebar">
          <TrafficLights appId="photos" onClose={closeApp} />
          <div className="photos-title">Photos</div>
          <label className="photos-import">
            Importer
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onUpload(e.target.files)}
            />
          </label>
        </header>
        <div className="photos-body">
          <aside className="photos-side">
            <button
              type="button"
              className={album === "all" ? "active" : ""}
              onClick={() => setAlbum("all")}
            >
              Photothèque
              <span>{library.length}</span>
            </button>
            {albums.map((a) => (
              <button
                key={a}
                type="button"
                className={album === a ? "active" : ""}
                onClick={() => setAlbum(a)}
              >
                {a}
                <span>{library.filter((p) => p.album === a).length}</span>
              </button>
            ))}
          </aside>
          <main className="photos-grid">
            {visible.map((p) => (
              <button
                key={p.id}
                type="button"
                className="photos-tile"
                onClick={() => setSelected(p)}
              >
                <img src={p.src} alt={p.name} draggable={false} />
              </button>
            ))}
            {visible.length === 0 && (
              <div className="photos-empty">Aucune photo</div>
            )}
          </main>
        </div>
        {selected && (
          <div className="photos-lightbox" onClick={() => setSelected(null)}>
            <img src={selected.src} alt={selected.name} />
            <div className="photos-lightbox-caption">{selected.name}</div>
          </div>
        )}
      </div>
    </AppWindowShell>
  );
}
