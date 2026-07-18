import React, { useContext, useEffect } from "react";
import { store } from "../../App";
import "./MenuBar.scss";
import { ReactComponent as Settings } from "../../assets/images/svg/settings.svg";
import DropdownMenu from "../DropdownMenu/DropdownMenu";
import ControlCenter from "../ControlCenter/ControlCenter";

const MENU_ITEMS: { id: string; label: string; bold?: boolean }[] = [
  { id: "finder", label: "Fichiers", bold: true },
  { id: "file", label: "File" },
  { id: "edit", label: "Edit" },
  { id: "view", label: "View" },
  { id: "go", label: "Go" },
  { id: "windows", label: "Window" },
  { id: "help", label: "Help" },
];

export default function MenuBar() {
  const [state, dispatch] = useContext(store);

  useEffect(() => {
    dispatch({ type: "date/SET" });
    const id = window.setInterval(() => {
      dispatch({ type: "date/SET" });
    }, 60000);
    return () => window.clearInterval(id);
  }, [dispatch]);

  const selectSection = (id: string) => {
    dispatch({
      type: "section/SELECT",
      payload: id,
    });
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
            alt="NXG"
            className="apple"
            src={require("../../assets/images/nxg-menubar.png")}
          />
          {state.section === "logo" ? <DropdownMenu /> : null}
        </div>

        {MENU_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`section ${item.bold ? "finder" : ""} ${
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
          <div className="setting set">
            <Settings className="settings set" onClick={toggleSettings} />
            <ControlCenter />
          </div>
          <h3 className="date">{state.date[0]}</h3>
          <h3>{state.date[1]}</h3>
        </div>
      </div>
    </>
  );
}
