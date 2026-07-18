export type MenuActionId =
  | "about-nxgos"
  | "open-settings"
  | "open-settings-about"
  | "store"
  | "recent-items"
  | "force-quit"
  | "sleep"
  | "restart"
  | "shutdown"
  | "lock"
  | "logout"
  | "about-fichiers"
  | "fichiers-prefs"
  | "empty-trash"
  | "hide-fichiers"
  | "hide-others"
  | "show-all"
  | "new-fichiers"
  | "new-folder"
  | "open-selected"
  | "close-window"
  | "get-info"
  | "rename"
  | "duplicate"
  | "trash"
  | "search"
  | "undo"
  | "redo"
  | "cut"
  | "copy"
  | "paste"
  | "select-all"
  | "clipboard"
  | "emoji"
  | "view-icons"
  | "view-list"
  | "view-columns"
  | "view-gallery"
  | "sort-name"
  | "cleanup"
  | "go-back"
  | "go-forward"
  | "go-recents"
  | "go-documents"
  | "go-desktop"
  | "go-downloads"
  | "go-trash"
  | "go-disk"
  | "go-folder"
  | "go-server"
  | "go-airdrop"
  | "go-network"
  | "go-drive"
  | "go-apps"
  | "minimize"
  | "maximize"
  | "cycle-windows"
  | "bring-front"
  | "help-nxgos"
  | "feedback";

export type MenuItem = {
  id?: MenuActionId;
  name: string;
  available: boolean;
  shortcut?: string;
};

export function fichiersCmd(cmd: string, payload?: unknown) {
  window.dispatchEvent(
    new CustomEvent("nxg-fichiers-cmd", { detail: { cmd, payload } })
  );
}

export function parametresSection(section: string) {
  window.dispatchEvent(
    new CustomEvent("nxg-parametres-section", { detail: section })
  );
}

export function toast(message: string) {
  window.dispatchEvent(
    new CustomEvent("nxg-toast", { detail: { message } })
  );
}

export function frontAppId(state: {
  onTop?: string;
  openApps?: Record<string, boolean>;
}): string | null {
  const top = state.onTop;
  if (
    top === "fichiers" ||
    top === "parametres" ||
    top === "calculator" ||
    top === "corbeille"
  ) {
    if (state.openApps?.[top]) return top;
  }
  if (state.openApps?.fichiers) return "fichiers";
  if (state.openApps?.parametres) return "parametres";
  if (state.openApps?.calculator) return "calculator";
  if (state.openApps?.corbeille) return "corbeille";
  return null;
}
