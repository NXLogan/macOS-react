import React, { useContext, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { store } from "../../App";
import toggleWallpaperVis from "../../utils/helpers/toggleWallpaperVis";
import {
  cleanupDesktopGrid,
  DesktopIcon,
  snapDesktopPosition,
} from "../Dock/dockApps";
import {
  createId,
  loadFs,
  saveFs,
  SPECIAL,
} from "../../apps/fichiers/fs";
import "./ContextMenu.scss";

type MenuItem =
  | { type: "item"; label: string; action: string; disabled?: boolean }
  | { type: "divider" };

const DESKTOP_ITEMS: MenuItem[] = [
  { type: "item", label: "Nouveau dossier", action: "new-folder" },
  { type: "divider" },
  { type: "item", label: "Lire les informations", action: "get-info" },
  {
    type: "item",
    label: "Modifier le fond d'écran…",
    action: "wallpaper",
  },
  { type: "divider" },
  { type: "item", label: "Utiliser les piles", action: "stacks", disabled: true },
  { type: "item", label: "Trier par nom", action: "sort-name" },
  { type: "item", label: "Ranger", action: "cleanup" },
  { type: "item", label: "Ranger par nom", action: "cleanup-name" },
  { type: "divider" },
  {
    type: "item",
    label: "Afficher les options de présentation",
    action: "view-options",
  },
];

const ICON_ITEMS: MenuItem[] = [
  { type: "item", label: "Ouvrir", action: "open" },
  { type: "divider" },
  { type: "item", label: "Lire les informations", action: "get-info-icon" },
  { type: "divider" },
  { type: "item", label: "Renommer", action: "rename" },
  { type: "item", label: "Placer dans la Corbeille", action: "trash" },
];

export default function ContextMenu() {
  const [state, dispatch] = useContext(store);
  const menuRef = useRef<HTMLDivElement>(null);
  const { open, x, y, target, targetId } = state.contextMenu;

  useLayoutEffect(() => {
    if (!open || !menuRef.current) return;
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    let nextX = x;
    let nextY = y;

    // Stick to cursor, open toward the right / bottom (macOS-like)
    if (nextX + rect.width > window.innerWidth - 8) {
      nextX = Math.max(8, x - rect.width);
    }
    if (nextY + rect.height > window.innerHeight - 8) {
      nextY = Math.max(8, window.innerHeight - rect.height - 8);
    }

    menu.style.left = `${nextX}px`;
    menu.style.top = `${nextY}px`;
  }, [open, x, y, target]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch({ type: "context/CLOSE" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dispatch]);

  const close = () => dispatch({ type: "context/CLOSE" });

  const findIcon = (): DesktopIcon | undefined =>
    state.desktopIcons.find((i: DesktopIcon) => i.id === targetId);

  const createDesktopFolder = () => {
    const nodes = loadFs();
    const folderId = createId("folder");
    const name = "Sans titre";
    nodes.push({
      id: folderId,
      name,
      kind: "folder",
      parentId: SPECIAL.desktop,
      createdAt: Date.now(),
    });
    saveFs(nodes);

    const pos = snapDesktopPosition(x + 12, y + 12);
    dispatch({
      type: "desktop/ADD_ICON",
      payload: {
        id: `desktop-folder-${folderId}`,
        name,
        icon: "fichiers.png",
        kind: "folder",
        folderId,
        x: pos.x,
        y: pos.y,
      },
    });
    window.dispatchEvent(new Event("nxg-fs-changed"));
  };

  const run = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const icon = findIcon();

    switch (action) {
      case "new-folder":
        createDesktopFolder();
        break;
      case "wallpaper":
        if (state.settings.wallpaper.open) {
          toggleWallpaperVis(e);
        }
        dispatch({ type: "wallpaper/TOGGLE" });
        break;
      case "get-info":
        window.alert(
          `Bureau NXG\n\n${state.desktopIcons.length} élément(s)\nFond d'écran : ${state.settings.wallpaper.name}`
        );
        break;
      case "sort-name":
        dispatch({
          type: "desktop/SET_ICONS",
          payload: [...state.desktopIcons].sort((a: DesktopIcon, b: DesktopIcon) =>
            a.name.localeCompare(b.name, "fr")
          ),
        });
        break;
      case "cleanup":
      case "cleanup-name":
        dispatch({
          type: "desktop/SET_ICONS",
          payload: cleanupDesktopGrid(state.desktopIcons),
        });
        break;
      case "view-options":
        window.alert(
          "Options de présentation\n\n• Icônes alignées sur une grille\n• Taille d'icône : 56 px\n• Étiquette sous l'icône"
        );
        break;
      case "stacks":
        break;
      case "open":
        if (!icon) break;
        if (icon.kind === "folder" && icon.folderId) {
          dispatch({
            type: "apps/OPEN",
            payload: "fichiers",
            folderId: icon.folderId,
          });
        } else if (icon.id === "fichiers") {
          dispatch({ type: "apps/OPEN", payload: "fichiers" });
        }
        break;
      case "get-info-icon":
        if (!icon) break;
        window.alert(
          `${icon.name}\n\nType : ${
            icon.kind === "folder" ? "Dossier" : "Application"
          }\nPosition : ${Math.round(icon.x)}, ${Math.round(icon.y)}`
        );
        break;
      case "rename": {
        if (!icon) break;
        const next = window.prompt("Renommer", icon.name);
        if (!next || !next.trim()) break;
        const name = next.trim();
        dispatch({
          type: "desktop/SET_ICONS",
          payload: state.desktopIcons.map((i: DesktopIcon) =>
            i.id === icon.id ? { ...i, name } : i
          ),
        });
        if (icon.kind === "folder" && icon.folderId) {
          const nodes = loadFs().map((n) =>
            n.id === icon.folderId ? { ...n, name } : n
          );
          saveFs(nodes);
          window.dispatchEvent(new Event("nxg-fs-changed"));
        }
        break;
      }
      case "trash":
        if (!icon) break;
        dispatch({ type: "desktop/REMOVE_ICON", payload: icon.id });
        if (icon.kind !== "folder") {
          dispatch({
            type: "dock/ADD",
            payload: { id: icon.id, name: icon.name, icon: icon.icon },
          });
        } else if (icon.folderId) {
          const nodes = loadFs().filter(
            (n) => n.id !== icon.folderId && n.parentId !== icon.folderId
          );
          saveFs(nodes);
          window.dispatchEvent(new Event("nxg-fs-changed"));
        }
        break;
      default:
        break;
    }

    close();
  };

  if (!open) return null;

  const items = target === "icon" ? ICON_ITEMS : DESKTOP_ITEMS;

  return createPortal(
    <div
      ref={menuRef}
      className="context-menu is-open"
      id="context-menu"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) =>
        item.type === "divider" ? (
          <div key={`d-${index}`} className="context-divider" />
        ) : (
          <button
            key={item.action}
            type="button"
            className={`context-item ${item.disabled ? "disabled" : ""}`}
            disabled={item.disabled}
            onClick={(e) => run(item.action, e)}
          >
            {item.label}
          </button>
        )
      )}
    </div>,
    document.body
  );
}
