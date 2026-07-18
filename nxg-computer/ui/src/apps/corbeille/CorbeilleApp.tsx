import React, { useContext, useEffect, useMemo, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import { snapDesktopPosition } from "../../desktop/Dock/dockApps";
import {
  fileIconLabel,
  formatDate,
  FsNode,
  loadFs,
} from "../fichiers/fs";
import {
  emptyTrash,
  hardDeleteNode,
  listTrash,
  restoreNode,
} from "../fichiers/fsApi";
import "./CorbeilleApp.scss";

export default function CorbeilleApp() {
  const [state, dispatch] = useContext(store);
  const [nodes, setNodes] = useState<FsNode[]>(() => loadFs());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const open = Boolean(state.openApps?.corbeille);

  useEffect(() => {
    const sync = () => setNodes(loadFs());
    window.addEventListener("nxg-fs-changed", sync);
    window.addEventListener("nxg-memory-hydrated", sync);
    return () => {
      window.removeEventListener("nxg-fs-changed", sync);
      window.removeEventListener("nxg-memory-hydrated", sync);
    };
  }, []);

  useEffect(() => {
    if (open) setNodes(loadFs());
  }, [open]);

  const items = useMemo(() => listTrash(nodes), [nodes]);
  const selected = items.find((i) => i.id === selectedId) || null;

  const toast = (message: string) => {
    window.dispatchEvent(new CustomEvent("nxg-toast", { detail: { message } }));
  };

  const restoreItem = (item: FsNode) => {
    const { restored } = restoreNode(item.id);
    setNodes(loadFs());
    setSelectedId(null);

    if (restored?.desktopApp) {
      const app = restored.desktopApp;
      const already = state.desktopIcons.some(
        (i: { id: string }) => i.id === app.id
      );
      if (!already) {
        const pos = snapDesktopPosition(48 + state.desktopIcons.length * 96, 72);
        dispatch({
          type: "desktop/ADD_ICON",
          payload: {
            id: app.id,
            name: app.name,
            icon: app.icon,
            kind: "app",
            x: pos.x,
            y: pos.y,
          },
        });
      }
      toast(`« ${app.name} » récupéré sur le Bureau`);
      return;
    }

    toast(
      restored
        ? `« ${restored.name} » récupéré`
        : `« ${item.name} » récupéré`
    );
  };

  const restoreSelected = () => {
    if (!selected) {
      toast("Sélectionne un élément à récupérer");
      return;
    }
    restoreItem(selected);
  };

  const deleteForever = () => {
    if (!selected) {
      toast("Sélectionne un élément à supprimer");
      return;
    }
    if (
      !window.confirm(
        `Supprimer définitivement « ${selected.name} » ?\nCette action est irréversible.`
      )
    ) {
      return;
    }
    setNodes(hardDeleteNode(selected.id));
    setSelectedId(null);
    toast(`« ${selected.name} » supprimé définitivement`);
  };

  const clearTrash = () => {
    if (items.length === 0) {
      toast("La Corbeille est déjà vide");
      return;
    }
    if (
      !window.confirm(
        `Vider la Corbeille ?\n${items.length} élément(s) seront supprimés définitivement.`
      )
    ) {
      return;
    }
    setNodes(emptyTrash());
    setSelectedId(null);
    toast("Corbeille vidée");
  };

  if (!open) return null;

  const closeApp = () => {
    dispatch({ type: "apps/CLOSE", payload: "corbeille" });
  };

  const itemKindLabel = (node: FsNode) => {
    if (node.desktopApp) return "Application";
    if (node.kind === "folder") return "Dossier";
    return "Fichier";
  };

  return (
    <AppWindowShell
      appId="corbeille"
      handle=".corbeille-titlebar"
      defaultPosition={{ x: 220, y: 100 }}
      windowClassName="corbeille-window"
      windowId="corbeille-window"
    >
      <div
        className="corbeille-window-hit"
        onMouseDown={() =>
          dispatch({ type: "onTop/SET", payload: "corbeille" })
        }
      >
        <header className="corbeille-titlebar">
          <TrafficLights appId="corbeille" onClose={closeApp} />
          <div className="corbeille-title">Corbeille</div>
        </header>

        <div className="corbeille-toolbar">
          <button
            type="button"
            className="corbeille-btn"
            disabled={!selected}
            onClick={restoreSelected}
          >
            Récupérer
          </button>
          <button
            type="button"
            className="corbeille-btn danger"
            disabled={!selected}
            onClick={deleteForever}
          >
            Supprimer
          </button>
          <div className="corbeille-toolbar-spacer" />
          <button
            type="button"
            className="corbeille-btn danger solid"
            disabled={items.length === 0}
            onClick={clearTrash}
          >
            Vider la Corbeille
          </button>
        </div>

        <div className="corbeille-body">
          {items.length === 0 ? (
            <div className="corbeille-empty">
              <div className="corbeille-empty-icon">🗑</div>
              <div className="corbeille-empty-title">Corbeille vide</div>
              <div className="corbeille-empty-sub">
                Les éléments placés dans la Corbeille apparaissent ici.
              </div>
            </div>
          ) : (
            <ul className="corbeille-list">
              {items.map((item) => {
                const active = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`corbeille-row ${active ? "selected" : ""}`}
                      onClick={() => setSelectedId(item.id)}
                      onDoubleClick={() => restoreItem(item)}
                    >
                      <span className="corbeille-row-ico">
                        {item.desktopApp ? (
                          <img
                            src={require(`../../assets/images/webp/${item.desktopApp.icon}`)}
                            alt=""
                            draggable={false}
                          />
                        ) : (
                          fileIconLabel(item)
                        )}
                      </span>
                      <span className="corbeille-row-meta">
                        <span className="corbeille-row-name">{item.name}</span>
                        <span className="corbeille-row-sub">
                          {itemKindLabel(item)} · {formatDate(item.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="corbeille-status">
          {items.length === 0
            ? "Aucun élément"
            : `${items.length} élément${items.length > 1 ? "s" : ""}`}
        </div>
      </div>
    </AppWindowShell>
  );
}
