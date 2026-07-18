import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Draggable from "react-draggable";
import { store } from "../../App";
import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import { ReactComponent as Minimize } from "../../assets/images/svg/minimize.svg";
import { ReactComponent as Stretch } from "../../assets/images/svg/stretch.svg";
import {
  createId,
  fileIconLabel,
  formatDate,
  formatSize,
  FsNode,
  getChildren,
  getNode,
  getPath,
  loadFs,
  saveFs,
  SidebarId,
  sidebarTarget,
  SPECIAL,
} from "./fs";
import "./FichiersApp.scss";

const SIDEBAR: { id: SidebarId; label: string; icon: string }[] = [
  { id: "recents", label: "Récents", icon: "⏱" },
  { id: "downloads", label: "Téléchargements", icon: "↓" },
  { id: "documents", label: "Documents", icon: "📄" },
  { id: "desktop", label: "Bureau", icon: "🖥" },
  { id: "disk", label: "Disque NXG", icon: "💾" },
];

export default function FichiersApp() {
  const [state, dispatch] = useContext(store);
  const [nodes, setNodes] = useState<FsNode[]>(() => loadFs());
  const [sidebar, setSidebar] = useState<SidebarId>("documents");
  const [currentId, setCurrentId] = useState<string>(SPECIAL.documents);
  const [history, setHistory] = useState<string[]>([SPECIAL.documents]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"icons" | "list">("list");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("Sans titre");
  const createInputRef = useRef<HTMLInputElement>(null);

  const open = Boolean(state.openApps?.fichiers);

  useEffect(() => {
    saveFs(nodes);
    window.dispatchEvent(new Event("nxg-memory-dirty"));
  }, [nodes]);

  useEffect(() => {
    const onFs = () => setNodes(loadFs());
    window.addEventListener("nxg-fs-changed", onFs);
    window.addEventListener("nxg-memory-hydrated", onFs);
    return () => {
      window.removeEventListener("nxg-fs-changed", onFs);
      window.removeEventListener("nxg-memory-hydrated", onFs);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setNodes(loadFs());
    const startId = state.fichiersStartId;
    if (startId) {
      setSidebar("desktop");
      setCurrentId(startId);
      setHistory([startId]);
      setHistoryIndex(0);
      setSearch("");
      dispatch({ type: "fichiers/SET_START", payload: undefined });
    }
  }, [open, state.fichiersStartId, dispatch]);

  useEffect(() => {
    if (creating) createInputRef.current?.focus();
  }, [creating]);

  const navigateTo = (folderId: string, pushHistory = true) => {
    setCurrentId(folderId);
    setSelectedId(null);
    setSearch("");
    if (pushHistory) {
      const next = [...history.slice(0, historyIndex + 1), folderId];
      setHistory(next);
      setHistoryIndex(next.length - 1);
    }
  };

  const goSidebar = (id: SidebarId) => {
    setSidebar(id);
    if (id === "recents") {
      setCurrentId(SPECIAL.disk);
      setSelectedId(null);
      return;
    }
    navigateTo(sidebarTarget(id));
  };

  const goBack = () => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setCurrentId(history[nextIndex]);
    setSelectedId(null);
  };

  const goForward = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setCurrentId(history[nextIndex]);
    setSelectedId(null);
  };

  const items = useMemo(() => {
    let list: FsNode[];
    if (sidebar === "recents" && !search) {
      list = [...nodes]
        .filter((n) => n.id !== SPECIAL.disk)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20);
    } else {
      list = getChildren(nodes, currentId);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = nodes
        .filter(
          (n) =>
            n.id !== SPECIAL.disk && n.name.toLowerCase().includes(q)
        )
        .sort((a, b) => a.name.localeCompare(b.name, "fr"));
    }
    return list;
  }, [nodes, currentId, search, sidebar]);

  const path = getPath(nodes, currentId);
  const currentFolder = getNode(nodes, currentId);

  const closeApp = () => {
    dispatch({ type: "apps/CLOSE", payload: "fichiers" });
  };

  const startCreateFolder = () => {
    setCreating(true);
    setNewName("Sans titre");
  };

  const confirmCreateFolder = () => {
    const name = newName.trim() || "Sans titre";
    const folder: FsNode = {
      id: createId("folder"),
      name,
      kind: "folder",
      parentId: currentId,
      createdAt: Date.now(),
    };
    setNodes((prev) => [...prev, folder]);
    setCreating(false);
    setSelectedId(folder.id);
  };

  const openItem = (node: FsNode) => {
    if (node.kind === "folder") {
      setSidebar("disk");
      navigateTo(node.id);
    }
  };

  if (!open) return null;

  return (
    <Draggable
      handle="#fichiers-handle"
      bounds="parent"
      defaultPosition={{ x: 120, y: 70 }}
    >
      <div className="fichiers-window" id="fichiers-window">
        <div className="fichiers-titlebar" id="fichiers-handle">
          <div className="fichiers-dots">
            <button
              type="button"
              className="dot red"
              onClick={closeApp}
              aria-label="Fermer"
            >
              <Close className="ico" />
            </button>
            <button type="button" className="dot yellow" aria-label="Réduire">
              <Minimize className="ico" />
            </button>
            <button type="button" className="dot green" aria-label="Plein écran">
              <Stretch className="ico" />
            </button>
          </div>
          <div className="fichiers-title">
            {search.trim()
              ? `Résultats pour « ${search.trim()} »`
              : currentFolder?.name ?? "Fichiers"}
          </div>
        </div>

        <div className="fichiers-toolbar">
          <div className="nav-btns">
            <button
              type="button"
              className="tb-btn"
              disabled={historyIndex <= 0}
              onClick={goBack}
            >
              ‹
            </button>
            <button
              type="button"
              className="tb-btn"
              disabled={historyIndex >= history.length - 1}
              onClick={goForward}
            >
              ›
            </button>
          </div>

          <button
            type="button"
            className="tb-action"
            onClick={startCreateFolder}
            disabled={sidebar === "recents" && !search}
          >
            + Nouveau dossier
          </button>

          <div className="view-toggle">
            <button
              type="button"
              className={view === "icons" ? "active" : ""}
              onClick={() => setView("icons")}
            >
              ▦
            </button>
            <button
              type="button"
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              ☰
            </button>
          </div>

          <div className="search-box">
            <span className="search-ico">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher"
            />
          </div>
        </div>

        <div className="fichiers-body">
          <aside className="fichiers-sidebar">
            <div className="side-label">Favoris</div>
            {SIDEBAR.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`side-item ${sidebar === item.id ? "active" : ""}`}
                onClick={() => goSidebar(item.id)}
              >
                <span className="side-ico">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </aside>

          <section className="fichiers-content">
            {!search && sidebar !== "recents" && (
              <div className="path-bar">
                {path.map((p, i) => (
                  <React.Fragment key={p.id}>
                    {i > 0 && <span className="sep">›</span>}
                    <button
                      type="button"
                      className="crumb"
                      onClick={() => navigateTo(p.id)}
                    >
                      {p.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {creating && (
              <div className="create-row">
                <span className="file-emoji">📁</span>
                <input
                  ref={createInputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmCreateFolder();
                    if (e.key === "Escape") setCreating(false);
                  }}
                  onBlur={confirmCreateFolder}
                />
              </div>
            )}

            {items.length === 0 ? (
              <div className="empty-state">Aucun élément</div>
            ) : view === "icons" ? (
              <div className="icon-grid">
                {items.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className={`icon-item ${
                      selectedId === node.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedId(node.id)}
                    onDoubleClick={() => openItem(node)}
                  >
                    <div className="icon-visual">{fileIconLabel(node)}</div>
                    <div className="icon-name">{node.name}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="list-view">
                <div className="list-head">
                  <span className="col name">Nom</span>
                  <span className="col date">Date de modification</span>
                  <span className="col size">Taille</span>
                  <span className="col kind">Nature</span>
                </div>
                {items.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className={`list-row ${
                      selectedId === node.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedId(node.id)}
                    onDoubleClick={() => openItem(node)}
                  >
                    <span className="col name">
                      <span className="row-ico">{fileIconLabel(node)}</span>
                      {node.name}
                    </span>
                    <span className="col date">{formatDate(node.createdAt)}</span>
                    <span className="col size">
                      {node.kind === "folder" ? "--" : formatSize(node.size)}
                    </span>
                    <span className="col kind">
                      {node.kind === "folder"
                        ? "Dossier"
                        : `Document ${node.ext?.toUpperCase() ?? ""}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="fichiers-status">
          {items.length} élément{items.length > 1 ? "s" : ""}
          {selectedId
            ? ` — ${getNode(nodes, selectedId)?.name ?? ""} sélectionné`
            : ""}
        </div>
      </div>
    </Draggable>
  );
}
