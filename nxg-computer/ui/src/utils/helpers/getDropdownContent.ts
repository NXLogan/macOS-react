import DropdownItemType from "../../store/types/DropdownItemType";
import storeType from "../../store/types/store";
import { frontAppId, MenuActionId } from "../../desktop/MenuBar/menuActions";
import { tFor } from "../../i18n/useT";

type Item = DropdownItemType & { id?: MenuActionId; shortcut?: string };

const d = (): Item => ({ name: "divider", available: false });

const getDropdownContent = (state: storeType): Item[] => {
  const lang = state.settings?.prefs?.language;
  const tr = (key: string) => tFor(lang, key);

  const front = frontAppId(state);
  const fichiersOpen = Boolean(state.openApps?.fichiers);
  const fichiersActive =
    fichiersOpen && !state.windowChrome?.fichiers?.minimized;
  const hasFront = Boolean(front);
  const canWin = hasFront;

  const item = (
    id: MenuActionId | undefined,
    key: string,
    available: boolean,
    shortcut?: string
  ): Item => ({
    id,
    name: tr(key),
    available,
    shortcut,
  });

  switch (state.section) {
    case "logo":
      return [
        item("about-nxgos", "menu.about-nxgos", true),
        d(),
        item("open-settings", "menu.open-settings", true),
        item("store", "menu.store", true),
        d(),
        item("recent-items", "menu.recent-items", true),
        d(),
        item("force-quit", "menu.force-quit", hasFront, "⌥⌘Esc"),
        d(),
        item("sleep", "menu.sleep", true),
        item("restart", "menu.restart", true),
        item("shutdown", "menu.shutdown", true),
        d(),
        item("lock", "menu.lock", true),
        item("logout", "menu.logout", true),
      ];
    case "fichiers":
      return [
        item("about-fichiers", "menu.about-fichiers", true),
        d(),
        item("fichiers-prefs", "menu.fichiers-prefs", true),
        d(),
        item("empty-trash", "menu.empty-trash", true),
        d(),
        item("hide-fichiers", "menu.hide-fichiers", fichiersActive),
        item("hide-others", "menu.hide-others", hasFront),
        item("show-all", "menu.show-all", true),
      ];
    case "file":
      return [
        item("new-fichiers", "menu.new-fichiers", true),
        item("new-folder", "menu.new-folder", true, "⇧⌘N"),
        { name: tr("menu.new-smart-folder"), available: false },
        d(),
        item("open-selected", "menu.open-selected", fichiersActive, "⌘O"),
        { name: tr("menu.open-with"), available: false },
        { name: tr("menu.print"), available: false },
        item("close-window", "menu.close-window", canWin, "⌘W"),
        d(),
        item("get-info", "menu.get-info", fichiersActive, "⌘I"),
        item("rename", "menu.rename", fichiersActive),
        item("duplicate", "menu.duplicate", fichiersActive, "⌘D"),
        { name: tr("menu.create-alias"), available: false },
        item("trash", "menu.trash", fichiersActive, "⌘⌫"),
        { name: tr("menu.eject"), available: false },
        d(),
        item("search", "menu.search", true, "⌘F"),
      ];
    case "edit":
      return [
        item("undo", "menu.undo", true, "⌘Z"),
        item("redo", "menu.redo", true, "⇧⌘Z"),
        d(),
        item("cut", "menu.cut", fichiersActive, "⌘X"),
        item("copy", "menu.copy", fichiersActive, "⌘C"),
        item("paste", "menu.paste", fichiersActive, "⌘V"),
        item("select-all", "menu.select-all", fichiersActive, "⌘A"),
        d(),
        item("clipboard", "menu.clipboard", true),
        { name: tr("menu.dictation"), available: false },
        item("emoji", "menu.emoji", true),
      ];
    case "view":
      return [
        item("view-icons", "menu.view-icons", true),
        item("view-list", "menu.view-list", true),
        item("view-columns", "menu.view-columns", true),
        item("view-gallery", "menu.view-gallery", true),
        d(),
        item("sort-name", "menu.sort-name", true),
        item("cleanup", "menu.cleanup", true),
        d(),
        { name: tr("menu.show-sidebar"), available: false },
        { name: tr("menu.show-path"), available: false },
        { name: tr("menu.show-status"), available: false },
      ];
    case "go":
      return [
        item("go-back", "menu.go-back", fichiersActive, "⌘["),
        item("go-forward", "menu.go-forward", fichiersActive, "⌘]"),
        d(),
        item("go-recents", "menu.go-recents", true),
        item("go-documents", "menu.go-documents", true),
        item("go-desktop", "menu.go-desktop", true),
        item("go-downloads", "menu.go-downloads", true),
        item("go-trash", "menu.go-trash", true),
        item("go-disk", "menu.go-disk", true),
        item("go-airdrop", "menu.go-airdrop", true),
        item("go-network", "menu.go-network", true),
        item("go-drive", "menu.go-drive", true),
        item("go-apps", "menu.go-apps", true),
        d(),
        item("go-folder", "menu.go-folder", true),
        item("go-server", "menu.go-server", true),
      ];
    case "windows":
      return [
        item("minimize", "menu.minimize", canWin, "⌘M"),
        item("maximize", "menu.maximize", canWin),
        d(),
        item("cycle-windows", "menu.cycle-windows", true, "⌘`"),
        d(),
        item("bring-front", "menu.bring-front", true),
      ];
    case "help":
      return [
        item("feedback", "menu.feedback", true),
        d(),
        item("help-nxgos", "menu.help-nxgos", true),
      ];
    default:
      return [];
  }
};

export default getDropdownContent;
