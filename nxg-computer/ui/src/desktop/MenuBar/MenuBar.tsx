import React, { useContext, useEffect, useState } from "react";
import { store } from "../../App";
import "./MenuBar.scss";
import { ReactComponent as Settings } from "../../assets/images/svg/settings.svg";
import DropdownMenu from "../DropdownMenu/DropdownMenu";
import ControlCenter from "../ControlCenter/ControlCenter";
import { frontAppId } from "./menuActions";
import getDate from "../../utils/helpers/getDate";

const MENU_ITEMS: { id: string; label: string; bold?: boolean }[] = [
  { id: "fichiers", label: "Fichiers", bold: true },
  { id: "file", label: "Fichier" },
  { id: "edit", label: "Édition" },
  { id: "view", label: "Présentation" },
  { id: "go", label: "Aller" },
  { id: "windows", label: "Fenêtre" },
  { id: "help", label: "Aide" },
];

export default function MenuBar() {
  const [state, dispatch] = useContext(store);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [clock, setClock] = useState(() => getDate());
  const front = frontAppId(state);

  const appLabel =
    front === "parametres"
      ? "Paramètres"
      : front === "calculator"
      ? "Calculatrice"
      : "Fichiers";

  useEffect(() => {
    const id = window.setInterval(() => setClock(getDate()), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onToast = (e: Event) => {
      const msg = (e as CustomEvent).detail?.message;
      if (!msg) return;
      setToastMsg(String(msg));
      window.setTimeout(() => setToastMsg(null), 2200);
    };
    window.addEventListener("nxg-toast", onToast);
    return () => window.removeEventListener("nxg-toast", onToast);
  }, []);

  const selectSection = (id: string) => {
    if (state.section === id) {
      dispatch({ type: "section/RESET" });
      return;
    }
    dispatch({ type: "section/SELECT", payload: id });
  };

  const toggleSettings = () => {
    if (state.settings.open) {
      dispatch({ type: "settings/CLOSE" });
    } else {
      dispatch({ type: "settings/OPEN" });
    }
  };

  return (
    <>
      <div className="filter" />
      <div className="nav-bar">
        <div
          className={`logo section ${
            state.section === "logo" ? "is-selected" : ""
          }`}
          id="logo"
          onClick={() => selectSection("logo")}
        >
          <img
            alt="NXGos"
            className="nxg-logo"
            src={require("../../assets/images/nxg-menubar.png")}
          />
          {state.section === "logo" ? <DropdownMenu /> : null}
        </div>

        {MENU_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`section ${item.bold ? "fichiers-menu app-menu" : ""} ${
              state.section === item.id ? "is-selected" : ""
            }`}
            id={item.id}
            onClick={() => selectSection(item.id)}
          >
            {item.bold ? appLabel : item.label}
            {state.section === item.id ? <DropdownMenu /> : null}
          </div>
        ))}

        <div className="right">
          <div className="status-pills" aria-hidden>
            <span
              className={`status-pill ${
                state.settings.prefs?.wifi ? "is-on" : "is-off"
              }`}
              title={state.settings.prefs?.wifi ? "Wi‑Fi" : "Wi‑Fi désactivé"}
            >
              Wi‑Fi
            </span>
            <span
              className={`status-pill ${
                state.settings.prefs?.bluetooth ? "is-on" : "is-off"
              }`}
              title={
                state.settings.prefs?.bluetooth
                  ? "Bluetooth"
                  : "Bluetooth désactivé"
              }
            >
              BT
            </span>
          </div>
          <div className="setting set">
            <Settings className="settings set" onClick={toggleSettings} />
            <ControlCenter />
          </div>
          <h3 className="date">{clock[0]}</h3>
          <h3>{clock[1]}</h3>
        </div>
      </div>

      {toastMsg ? <div className="nxg-menubar-toast">{toastMsg}</div> : null}
    </>
  );
}
