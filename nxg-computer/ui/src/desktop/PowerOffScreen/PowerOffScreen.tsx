import React, { useContext } from "react";
import { store } from "../../App";
import { useT } from "../../i18n/useT";
import "./PowerOffScreen.scss";

/** Black screen after shutdown — click (browser) or NUI open to power on. */
export default function PowerOffScreen() {
  const [, dispatch] = useContext(store);
  const t = useT();

  const powerOn = () => {
    dispatch({ type: "system/POWER_ON" });
  };

  return (
    <button
      type="button"
      className="nxg-power-off"
      aria-label={t("power.aria")}
      onClick={powerOn}
    >
      <span className="nxg-power-off-hint">{t("power.clickToPowerOn")}</span>
    </button>
  );
}
