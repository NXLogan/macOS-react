import storeType from "../../store/types/store";
import { cleanupDesktopGrid, snapDesktopPosition } from "../Dock/dockApps";
import {
  fichiersCmd,
  frontAppId,
  MenuActionId,
  parametresSection,
  toast,
} from "./menuActions";
import { SPECIAL } from "../../apps/fichiers/fs";
import { createFolder, emptyTrash } from "../../apps/fichiers/fsApi";

type Dispatch = (action: { type: string; payload?: unknown; index?: number; folderId?: string }) => void;

function openFichiers(dispatch: Dispatch, folderId?: string) {
  dispatch({
    type: "apps/OPEN",
    payload: "fichiers",
    folderId,
  });
  dispatch({ type: "onTop/SET", payload: "fichiers" });
}

function openParametres(dispatch: Dispatch, section?: string) {
  dispatch({ type: "apps/OPEN", payload: "parametres" });
  dispatch({ type: "onTop/SET", payload: "parametres" });
  if (section) {
    window.setTimeout(() => parametresSection(section), 40);
  }
}

function ensureFichiersThen(dispatch: Dispatch, state: storeType, fn: () => void) {
  if (!state.openApps?.fichiers) {
    openFichiers(dispatch);
    window.setTimeout(fn, 80);
  } else {
    dispatch({ type: "window/RESTORE", payload: "fichiers" });
    dispatch({ type: "onTop/SET", payload: "fichiers" });
    fn();
  }
}

function createDesktopFolder(dispatch: Dispatch, _state: storeType) {
  const { folder } = createFolder(SPECIAL.desktop, "Nouveau dossier");
  const pos = snapDesktopPosition(48, 72);
  dispatch({
    type: "desktop/ADD_ICON",
    payload: {
      id: `desktop-folder-${folder.id}`,
      name: folder.name,
      icon: "fichiers.png",
      kind: "folder",
      folderId: folder.id,
      x: pos.x,
      y: pos.y,
    },
  });
  toast(`Dossier « ${folder.name} » créé sur le Bureau`);
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copié dans le presse-papiers");
  } catch {
    toast("Impossible d’accéder au presse-papiers");
  }
}

export { writeClipboard };

export async function runMenuAction(
  id: MenuActionId,
  state: storeType,
  dispatch: Dispatch
) {
  const front = frontAppId(state);
  const fichiersOpen = Boolean(state.openApps?.fichiers);
  const APP_IDS = ["fichiers", "parametres", "calculator"] as const;

  switch (id) {
    case "about-nxgos":
      openParametres(dispatch, "apropos");
      break;
    case "open-settings":
      openParametres(dispatch);
      break;
    case "open-settings-about":
      openParametres(dispatch, "apropos");
      break;
    case "store":
      toast("Boutique NXG — bientôt disponible");
      break;
    case "recent-items":
      ensureFichiersThen(dispatch, state, () =>
        fichiersCmd("go-sidebar", "recents")
      );
      break;
    case "force-quit": {
      if (front) {
        const labels: Record<string, string> = {
          fichiers: "Fichiers",
          parametres: "Paramètres",
          calculator: "Calculatrice",
        };
        dispatch({ type: "apps/CLOSE", payload: front });
        toast(`${labels[front] || front} fermé`);
      } else {
        toast("Aucune app à fermer");
      }
      break;
    }
    case "sleep":
    case "lock":
    case "logout":
      dispatch({ type: "auth/LOCK" });
      dispatch({ type: "section/RESET" });
      break;
    case "restart":
      if (window.confirm("Redémarrer NXGos ?")) {
        window.location.reload();
      }
      break;
    case "shutdown":
      if (window.confirm("Éteindre NXGos ?")) {
        Object.keys(state.openApps || {}).forEach((appId) => {
          if (state.openApps[appId]) {
            dispatch({ type: "apps/CLOSE", payload: appId });
          }
        });
        dispatch({ type: "auth/LOCK" });
        toast("Session terminée");
      }
      break;

    case "about-fichiers":
      openFichiers(dispatch);
      toast("Fichiers — explorateur NXGos v1.0");
      break;
    case "fichiers-prefs":
      openParametres(dispatch, "confidentialite");
      break;
    case "empty-trash": {
      emptyTrash();
      toast("Corbeille vidée");
      break;
    }
    case "hide-fichiers":
      if (fichiersOpen) dispatch({ type: "window/MINIMIZE", payload: "fichiers" });
      break;
    case "hide-others":
      APP_IDS.forEach((id) => {
        if (id !== front && state.openApps?.[id]) {
          dispatch({ type: "window/MINIMIZE", payload: id });
        }
      });
      break;
    case "show-all":
      APP_IDS.forEach((id) => {
        if (state.openApps?.[id]) {
          dispatch({ type: "window/RESTORE", payload: id });
        }
      });
      break;

    case "new-fichiers":
      openFichiers(dispatch);
      break;
    case "new-folder":
      if (fichiersOpen && !state.windowChrome?.fichiers?.minimized) {
        fichiersCmd("new-folder");
      } else {
        createDesktopFolder(dispatch, state);
      }
      break;
    case "open-selected":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("open-selected"));
      break;
    case "close-window":
      if (front) dispatch({ type: "apps/CLOSE", payload: front });
      else toast("Aucune fenêtre ouverte");
      break;
    case "get-info":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("get-info"));
      break;
    case "rename":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("rename"));
      break;
    case "duplicate":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("duplicate"));
      break;
    case "trash":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("trash"));
      break;
    case "search":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("search-focus"));
      break;

    case "undo":
    case "redo":
      toast(id === "undo" ? "Rien à annuler" : "Rien à rétablir");
      break;
    case "cut":
    case "copy":
      ensureFichiersThen(dispatch, state, () => fichiersCmd(id));
      break;
    case "paste":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("paste"));
      break;
    case "select-all":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("select-all"));
      break;
    case "clipboard":
      try {
        const text = await navigator.clipboard.readText();
        toast(text ? `Presse-papiers : ${text.slice(0, 48)}` : "Presse-papiers vide");
      } catch {
        toast("Presse-papiers inaccessible");
      }
      break;
    case "emoji":
      toast("Utilise les emojis de ton clavier 😀");
      break;

    case "view-icons":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("view", "icons"));
      break;
    case "view-list":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("view", "list"));
      break;
    case "view-columns":
    case "view-gallery":
      ensureFichiersThen(dispatch, state, () => {
        fichiersCmd("view", "icons");
        toast(
          id === "view-columns"
            ? "Vue colonnes → affichage icônes"
            : "Vue galerie → affichage icônes"
        );
      });
      break;
    case "sort-name":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("sort-name"));
      break;
    case "cleanup":
      dispatch({
        type: "desktop/SET_ICONS",
        payload: cleanupDesktopGrid(state.desktopIcons),
      });
      toast("Bureau rangé");
      break;

    case "go-back":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("go-back"));
      break;
    case "go-forward":
      ensureFichiersThen(dispatch, state, () => fichiersCmd("go-forward"));
      break;
    case "go-recents":
      ensureFichiersThen(dispatch, state, () =>
        fichiersCmd("go-sidebar", "recents")
      );
      break;
    case "go-documents":
      ensureFichiersThen(dispatch, state, () =>
        fichiersCmd("go-sidebar", "documents")
      );
      break;
    case "go-desktop":
      ensureFichiersThen(dispatch, state, () =>
        fichiersCmd("go-sidebar", "desktop")
      );
      break;
    case "go-downloads":
      ensureFichiersThen(dispatch, state, () =>
        fichiersCmd("go-sidebar", "downloads")
      );
      break;
    case "go-trash":
      ensureFichiersThen(dispatch, state, () =>
        fichiersCmd("go-sidebar", "trash")
      );
      break;
    case "go-disk":
    case "go-apps":
    case "go-drive":
      ensureFichiersThen(dispatch, state, () =>
        fichiersCmd("go-sidebar", "disk")
      );
      break;
    case "go-folder": {
      const path = window.prompt("Aller au dossier (ex. Documents, Bureau)", "Documents");
      if (!path) break;
      const map: Record<string, string> = {
        documents: "documents",
        document: "documents",
        bureau: "desktop",
        desktop: "desktop",
        téléchargements: "downloads",
        telechargements: "downloads",
        downloads: "downloads",
        récents: "recents",
        recents: "recents",
        disque: "disk",
      };
      const key = map[path.trim().toLowerCase()] || "documents";
      ensureFichiersThen(dispatch, state, () => fichiersCmd("go-sidebar", key));
      break;
    }
    case "go-server":
      toast("Aucun serveur NXG disponible");
      break;
    case "go-airdrop":
      dispatch({ type: "settings/AIRDROP" });
      toast(
        !state.settings.airdrop ? "Partage NXG activé" : "Partage NXG désactivé"
      );
      break;
    case "go-network":
      openParametres(dispatch, "reseau");
      break;

    case "minimize":
      if (front) dispatch({ type: "window/MINIMIZE", payload: front });
      break;
    case "maximize":
      if (front) dispatch({ type: "window/TOGGLE_MAX", payload: front });
      break;
    case "cycle-windows": {
      const open = APP_IDS.filter(
        (id) => state.openApps?.[id] && !state.windowChrome?.[id]?.minimized
      );
      if (open.length < 2) {
        const any = APP_IDS.find((id) => state.openApps?.[id]);
        if (any) {
          dispatch({ type: "window/RESTORE", payload: any });
          dispatch({ type: "onTop/SET", payload: any });
        } else toast("Aucune fenêtre");
        break;
      }
      const idx = open.indexOf(
        (front as (typeof APP_IDS)[number]) || open[0]
      );
      const next = open[(idx + 1) % open.length];
      dispatch({ type: "onTop/SET", payload: next });
      dispatch({ type: "window/RESTORE", payload: next });
      break;
    }
    case "bring-front":
      APP_IDS.forEach((id) => {
        if (state.openApps?.[id]) {
          dispatch({ type: "window/RESTORE", payload: id });
        }
      });
      break;

    case "help-nxgos":
      window.alert(
        "Aide NXGos\n\n• Dock / barre d’apps : lance les applications\n• Fichiers : explore le disque NXG\n• Paramètres : personnalise NXGos\n• Glisse les apps entre le bureau et la barre\n\nVersion 1.0.0 — NXG"
      );
      break;
    case "feedback":
      toast("Merci — retour envoyé à NXG (simulation)");
      break;

    default:
      break;
  }

  dispatch({ type: "section/RESET" });
}
