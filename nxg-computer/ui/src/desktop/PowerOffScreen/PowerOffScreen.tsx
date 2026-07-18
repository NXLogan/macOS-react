import React, { useContext } from "react";
import { store } from "../../App";
import "./PowerOffScreen.scss";

/** Black screen after shutdown — click (browser) or NUI open to power on. */
export default function PowerOffScreen() {
  const [, dispatch] = useContext(store);

  const powerOn = () => {
    dispatch({ type: "system/POWER_ON" });
  };

  return (
    <button
      type="button"
      className="nxg-power-off"
      aria-label="Allumer"
      onClick={powerOn}
    >
      <span className="nxg-power-off-hint">Cliquer pour allumer</span>
    </button>
  );
}
