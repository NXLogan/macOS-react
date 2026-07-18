import React, { useContext } from "react";
import { store } from "../../App";
import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import { ReactComponent as Minimize } from "../../assets/images/svg/minimize.svg";
import { ReactComponent as Stretch } from "../../assets/images/svg/stretch.svg";
import { requestWindowClose } from "./AppWindowShell";
import "./AppWindow.scss";

type Props = {
  appId: string;
  onClose?: () => void;
};

export default function TrafficLights({ appId, onClose }: Props) {
  const [state, dispatch] = useContext(store);
  const chrome = state.windowChrome?.[appId] || {
    minimized: false,
    maximized: false,
  };

  const close = (e: React.MouseEvent) => {
    e.stopPropagation();
    requestWindowClose(appId, () => {
      if (onClose) onClose();
      else dispatch({ type: "apps/CLOSE", payload: appId });
    });
  };

  const minimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (chrome.minimized) {
      dispatch({ type: "window/RESTORE", payload: appId });
      return;
    }
    dispatch({ type: "window/MINIMIZE", payload: appId });
  };

  const toggleMax = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "window/TOGGLE_MAX", payload: appId });
  };

  return (
    <div className="nxg-traffic" onMouseDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="dot red"
        onClick={close}
        aria-label="Fermer"
        title="Fermer"
      >
        <Close className="ico" />
      </button>
      <button
        type="button"
        className="dot yellow"
        onClick={minimize}
        aria-label="Réduire"
        title="Réduire dans la barre"
      >
        <Minimize className="ico" />
      </button>
      <button
        type="button"
        className="dot green"
        onClick={toggleMax}
        aria-label={chrome.maximized ? "Quitter le plein écran" : "Agrandir"}
        title={chrome.maximized ? "Réduire la fenêtre" : "Agrandir"}
      >
        <Stretch className="ico" />
      </button>
    </div>
  );
}

export { windowChromeClass } from "./AppWindowShell";
