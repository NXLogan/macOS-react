import React, { useContext } from "react";
import getDropdownContent from "../../utils/helpers/getDropdownContent";
import { store } from "../../App";
import { MenuActionId } from "../MenuBar/menuActions";
import { runMenuAction } from "../MenuBar/runMenuAction";
import "./DropdownMenu.scss";

export default function DropdownMenu() {
  const [state, dispatch] = useContext(store);
  const content = getDropdownContent(state);

  const onItem = async (item: (typeof content)[number]) => {
    if (!item.available || item.name === "divider" || !item.id) return;
    await runMenuAction(item.id as MenuActionId, state, dispatch);
  };

  return (
    <div
      className={`dd dropdown-menu ${
        state.section === "logo"
          ? "dd-logo"
          : state.section === "fichiers"
          ? "dd-fichiers"
          : state.section === "file"
          ? "dd-file"
          : state.section === "edit"
          ? "dd-edit"
          : state.section === "view"
          ? "dd-view"
          : state.section === "go"
          ? "dd-go"
          : state.section === "windows"
          ? "dd-windows"
          : state.section === "help"
          ? "dd-help"
          : ""
      }`}
      role="menu"
    >
      {content.map((item, i) => {
        if (item.name === "divider") {
          return <div key={`div-${i}`} className="divider dd" />;
        }

        return (
          <button
            key={`${item.id || item.name}-${i}`}
            type="button"
            role="menuitem"
            disabled={!item.available}
            className={`dropdown-item dd ${
              item.available ? "selectable" : "unselectable"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              void onItem(item);
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="dd-label">{item.name}</span>
            {item.shortcut ? (
              <span className="dd-shortcut">{item.shortcut}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
