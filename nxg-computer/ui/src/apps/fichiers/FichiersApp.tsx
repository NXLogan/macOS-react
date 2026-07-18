import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import {
  fileIconLabel,
  formatDate,
  formatSize,
  FsNode,
  getChildren,
  getNode,
  getPath,
  loadFs,
  SidebarId,
  sidebarTarget,
  SPECIAL,
} from "./fs";
import {
  createFolder,
  duplicateNode,
  renameNode,
  trashNode,
} from "./fsApi";
import "./FichiersApp.scss";

const SIDEBAR: {
  id: SidebarId;
  label: string;
  icon: string;
  color: string;
}[] = [
  { id: "recents", label: "Récents", icon: "⏱", color: "#5e5ce6" },
  { id: "downloads", label: "Téléchargements", icon: "↓", color: "#0a84ff" },
  { id: "documents", label: "Documents", icon: "📄", color: "#64d2ff" },
  { id: "desktop", label: "Bureau", icon: "🖥", color: "#30d158" },
  { id: "trash", label: "Corbeille", icon: "🗑", color: "#8e8e93" },
  { id: "disk", label: "Disque NXG", icon: "💾", color: "#ff9f0a" },
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
  const [newName, setNewName] = useState("Nouveau dossier");
  const createInputRef = useRef<HTMLInputElement>(null);

  const open = Boolean(state.openApps?.fichiers);
  const filesAllowed = state.settings?.prefs?.permissions?.files !== false;

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
    if (!filesAllowed) {
      dispatch({ type: "apps/CLOSE", payload: "fichiers" });
      window.dispatchEvent(
        new CustomEvent("nxg-toast", {
          detail: {
            message: "Accès Fichiers désactivé — active-le dans Paramètres",
          },
        })
      );
      return;
    }
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
  }, [open, state.fichiersStartId, dispatch, filesAllowed]);

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
    setNewName("Nouveau dossier");
  };

  const confirmCreateFolder = () => {
    const name = newName.trim() || "Nouveau dossier";
    const { nodes: next, folder } = createFolder(currentId, name);
    setNodes(next);
    setCreating(false);
    setSelectedId(folder.id);
  };

  const openItem = (node: FsNode) => {
    if (node.kind === "folder") {
      setSidebar("disk");
      navigateTo(node.id);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onCmd = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        cmd?: string;
        payload?: unknown;
      };
      const cmd = detail?.cmd;
      if (!cmd) return;

      const selected = selectedId ? getNode(nodes, selectedId) : null;

      switch (cmd) {
        case "new-folder":
          if (!(sidebar === "recents" && !search)) startCreateFolder();
          break;
        case "view":
          if (detail.payload === "icons" || detail.payload === "list") {
            setView(detail.payload);
          }
          break;
        case "search-focus": {
          const input = document.querySelector(
            ".fichiers-window .search-box input"
          ) as HTMLInputElement | null;
          input?.focus();
          input?.select();
          break;
        }
        case "go-sidebar":
          if (typeof detail.payload === "string") {
            goSidebar(detail.payload as SidebarId);
          }
          break;
        case "go-back":
          goBack();
          break;
        case "go-forward":
          goForward();
          break;
        case "open-selected":
          if (selected) openItem(selected);
          else
            window.dispatchEvent(
              new CustomEvent("nxg-toast", {
                detail: { message: "Sélectionne un élément" },
              })
            );
          break;
        case "get-info":
          if (selected) {
            window.alert(
              `${selected.name}\n\nType : ${
                selected.kind === "folder" ? "Dossier" : "Fichier"
              }\nCréé : ${formatDate(selected.createdAt)}${
                selected.size ? `\nTaille : ${formatSize(selected.size)}` : ""
              }`
            );
          } else {
            window.alert(
              `Dossier courant : ${currentFolder?.name ?? "—"}\n${
                items.length
              } élément(s)`
            );
          }
          break;
        case "rename": {
          if (!selected) {
            window.dispatchEvent(
              new CustomEvent("nxg-toast", {
                detail: { message: "Sélectionne un élément à renommer" },
              })
            );
            break;
          }
          const next = window.prompt("Renommer", selected.name);
          if (!next?.trim()) break;
          setNodes(renameNode(selected.id, next.trim()));
          break;
        }
        case "duplicate": {
          if (!selected) break;
          const { nodes: next, copy } = duplicateNode(selected.id);
          setNodes(next);
          if (copy) setSelectedId(copy.id);
          break;
        }
        case "trash": {
          if (!selected) break;
          setNodes(trashNode(selected.id));
          setSelectedId(null);
          window.dispatchEvent(
            new CustomEvent("nxg-toast", {
              detail: {
                message:
                  selected.parentId === SPECIAL.trash
                    ? `« ${selected.name} » supprimé`
                    : `« ${selected.name} » dans la Corbeille`,
              },
            })
          );
          break;
        }
        case "select-all":
          if (items[0]) setSelectedId(items[0].id);
          break;
        case "copy":
        case "cut":
          if (selected) {
            void navigator.clipboard?.writeText(selected.name);
            window.dispatchEvent(
              new CustomEvent("nxg-toast", {
                detail: {
                  message:
                    cmd === "cut"
                      ? `« ${selected.name} » coupé (nom)`
                      : `« ${selected.name} » copié`,
                },
              })
            );
          }
          break;
        case "paste":
          window.dispatchEvent(
            new CustomEvent("nxg-toast", {
              detail: { message: "Collage simulé — crée un nouveau dossier" },
            })
          );
          startCreateFolder();
          break;
        case "sort-name":
          window.dispatchEvent(
            new CustomEvent("nxg-toast", {
              detail: { message: "Trié par nom (affichage)" },
            })
          );
          break;
        default:
          break;
      }
    };

    window.addEventListener("nxg-fichiers-cmd", onCmd);
    return () => window.removeEventListener("nxg-fichiers-cmd", onCmd);
    // Handlers close over latest navigate/open state intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    selectedId,
    nodes,
    sidebar,
    search,
    items,
    currentFolder,
    historyIndex,
    history,
  ]);

  if (!open) return null;

  return (
    <AppWindowShell
      appId="fichiers"
      handle="#fichiers-handle"
      defaultPosition={{ x: 120, y: 70 }}
      windowClassName="fichiers-window"
      windowId="fichiers-window"
    >
        <div
          className="fichiers-window-hit"
          onMouseDown={() =>
            dispatch({ type: "onTop/SET", payload: "fichiers" })
          }
        >
        <div className="fichiers-titlebar" id="fichiers-handle">
          <TrafficLights appId="fichiers" onClose={closeApp} />
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
                <span
                  className="side-badge"
                  style={{ background: item.color }}
                >
                  {item.icon}
                </span>
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
    </AppWindowShell>
  );
}
