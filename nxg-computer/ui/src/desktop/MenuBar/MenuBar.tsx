import React, { useContext, useEffect, useState } from "react";
import { store } from "../../App";
import "./MenuBar.scss";
import { ReactComponent as Settings } from "../../assets/images/svg/settings.svg";
import { ReactComponent as WifiIcon } from "../../assets/images/svg/wifi.svg";
import DropdownMenu from "../DropdownMenu/DropdownMenu";
import ControlCenter from "../ControlCenter/ControlCenter";
import { frontAppId } from "./menuActions";
import getDate from "../../utils/helpers/getDate";
import { useT } from "../../i18n/useT";

export default function MenuBar() {
  const [state, dispatch] = useContext(store);
  const t = useT();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const lang = state.settings?.prefs?.language;
  const [clock, setClock] = useState(() => getDate(lang));
  const front = frontAppId(state);
  const wifiOn = state.settings.prefs?.wifi !== false;

  const appLabel = front ? t(`apps.${front}.name`) : "NXGos";
  if (appLabel.startsWith("apps.")) {
    /* fallback if unknown app id */
  }
  const frontLabel =
    front && !t(`apps.${front}.name`).startsWith("apps.")
      ? t(`apps.${front}.name`)
      : front || "NXGos";

  const menus = [
    { id: "fichiers", label: frontLabel, bold: true as const },
    { id: "file", label: t("menubar.file") },
    { id: "edit", label: t("menubar.edit") },
    { id: "view", label: t("menubar.view") },
    { id: "go", label: t("menubar.go") },
    { id: "windows", label: t("menubar.windows") },
    { id: "help", label: t("menubar.help") },
  ];

  useEffect(() => {
    setClock(getDate(lang));
    const id = window.setInterval(() => setClock(getDate(lang)), 30000);
    return () => window.clearInterval(id);
  }, [lang]);

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

  const openReseau = () => {
    dispatch({ type: "apps/OPEN", payload: "parametres" });
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("nxg-parametres-section", { detail: "reseau" })
      );
    }, 40);
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

        {menus.map((item) => (
          <div
            key={item.id}
            className={`section ${item.bold ? "fichiers-menu app-menu" : ""} ${
              state.section === item.id ? "is-selected" : ""
            }`}
            id={item.id}
            onClick={() => selectSection(item.id)}
          >
            {item.label}
            {state.section === item.id ? <DropdownMenu /> : null}
          </div>
        ))}

        <div className="right">
          <div className="status-icons">
            <button
              type="button"
              className={`status-icon wifi ${wifiOn ? "is-on" : "is-off"}`}
              title={wifiOn ? t("menubar.wifiOn") : t("menubar.wifiOff")}
              aria-label={wifiOn ? t("menubar.wifiOn") : t("menubar.wifiOff")}
              onClick={openReseau}
            >
              <WifiIcon className="wifi-glyph" />
              {!wifiOn ? <span className="wifi-slash" aria-hidden /> : null}
            </button>
            <span
              className={`status-pill ${
                state.settings.prefs?.bluetooth ? "is-on" : "is-off"
              }`}
              title={
                state.settings.prefs?.bluetooth
                  ? t("menubar.btOn")
                  : t("menubar.btOff")
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
