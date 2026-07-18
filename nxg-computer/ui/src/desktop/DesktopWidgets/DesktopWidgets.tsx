import React, { useContext } from "react";
import { store } from "../../App";
import "./DesktopWidgets.scss";

export default function DesktopWidgets() {
  const [state] = useContext(store);
  if (!state.settings?.prefs?.widgets) return null;
  if (state.booting || state.locked) return null;

  const now = new Date();
  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="desktop-widgets" aria-hidden>
      <div className="desktop-widget weather">
        <div className="dw-city">Los Santos</div>
        <div className="dw-temp">24°</div>
        <div className="dw-cond">Ensoleillé</div>
        <div className="dw-meta">
          {date} · {time}
        </div>
      </div>
    </div>
  );
}
