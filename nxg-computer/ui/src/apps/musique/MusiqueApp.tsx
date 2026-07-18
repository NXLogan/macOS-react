import React, { useContext, useEffect, useRef, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import "./MusiqueApp.scss";

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function MusiqueApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.musique);
  const [url, setUrl] = useState("");
  const [playingUrl, setPlayingUrl] = useState("");
  const [yt, setYt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("En attente d’une URL");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
    }
  }, [open]);

  const launch = () => {
    const raw = url.trim();
    if (!raw) {
      setError("Colle une URL de musique");
      return;
    }
    setError("");
    const embed = youtubeEmbed(raw);
    if (embed) {
      setYt(embed);
      setPlayingUrl(raw);
      setStatus("Lecture YouTube");
      return;
    }
    setYt(null);
    setPlayingUrl(raw);
    setStatus("Chargement…");
    window.setTimeout(() => {
      audioRef.current?.play().catch(() => {
        setError(
          "Impossible de lire ce fichier — utilise un lien .mp3/.ogg direct ou YouTube"
        );
        setStatus("Erreur");
      });
    }, 50);
  };

  if (!open) return null;
  const closeApp = () => {
    audioRef.current?.pause();
    dispatch({ type: "apps/CLOSE", payload: "musique" });
  };

  return (
    <AppWindowShell
      appId="musique"
      handle=".musique-titlebar"
      defaultPosition={{ x: 200, y: 120 }}
      windowClassName="musique-window"
      windowId="musique-window"
    >
      <div
        className="musique-hit"
        onMouseDown={() => dispatch({ type: "onTop/SET", payload: "musique" })}
      >
        <header className="musique-titlebar">
          <TrafficLights appId="musique" onClose={closeApp} />
          <div className="musique-title">Musique</div>
        </header>

        <div className="musique-hero">
          <div className="musique-art">♫</div>
          <div className="musique-now">
            <div className="musique-now-label">En cours</div>
            <div className="musique-now-url">
              {playingUrl || "Aucune piste"}
            </div>
            <div className="musique-status">{status}</div>
          </div>
        </div>

        <form
          className="musique-form"
          onSubmit={(e) => {
            e.preventDefault();
            launch();
          }}
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL mp3 / ogg / YouTube…"
            spellCheck={false}
          />
          <button type="submit">Lire</button>
        </form>
        {error ? <div className="musique-error">{error}</div> : null}

        {yt ? (
          <iframe
            className="musique-yt"
            title="YouTube"
            src={yt}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <audio
            ref={audioRef}
            className="musique-audio"
            controls
            src={playingUrl || undefined}
            onPlay={() => setStatus("Lecture")}
            onPause={() => setStatus("Pause")}
            onEnded={() => setStatus("Terminé")}
            onError={() => {
              if (playingUrl && !yt) {
                setError("Fichier non lisible dans le navigateur NUI");
                setStatus("Erreur");
              }
            }}
          />
        )}
      </div>
    </AppWindowShell>
  );
}
