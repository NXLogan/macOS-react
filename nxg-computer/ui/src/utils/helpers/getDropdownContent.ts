import DropdownItemType from "../../store/types/DropdownItemType";
import storeType from "../../store/types/store";
import { frontAppId, MenuActionId } from "../../desktop/MenuBar/menuActions";

type Item = DropdownItemType & { id?: MenuActionId; shortcut?: string };

const d = (): Item => ({ name: "divider", available: false });

const getDropdownContent = (state: storeType): Item[] => {
  const front = frontAppId(state);
  const fichiersOpen = Boolean(state.openApps?.fichiers);
  const fichiersActive =
    fichiersOpen && !state.windowChrome?.fichiers?.minimized;
  const hasFront = Boolean(front);
  const canWin = hasFront;

  switch (state.section) {
    case "logo":
      return [
        { id: "about-nxgos", name: "À propos de NXGos", available: true },
        d(),
        { id: "open-settings", name: "Paramètres NXGos…", available: true },
        { id: "store", name: "Boutique NXG", available: true },
        d(),
        { id: "recent-items", name: "Éléments récents", available: true },
        d(),
        {
          id: "force-quit",
          name: "Forcer la fermeture",
          available: hasFront,
          shortcut: "⌥⌘Esc",
        },
        d(),
        { id: "sleep", name: "Veille", available: true },
        { id: "restart", name: "Redémarrer…", available: true },
        { id: "shutdown", name: "Éteindre…", available: true },
        d(),
        { id: "lock", name: "Verrouiller l’écran", available: true },
        { id: "logout", name: "Se déconnecter…", available: true },
      ];
    case "fichiers":
      return [
        { id: "about-fichiers", name: "À propos de Fichiers", available: true },
        d(),
        { id: "fichiers-prefs", name: "Préférences…", available: true },
        d(),
        { id: "empty-trash", name: "Vider la corbeille", available: true },
        d(),
        {
          id: "hide-fichiers",
          name: "Masquer Fichiers",
          available: fichiersActive,
        },
        {
          id: "hide-others",
          name: "Masquer les autres",
          available: hasFront,
        },
        { id: "show-all", name: "Tout afficher", available: true },
      ];
    case "file":
      return [
        { id: "new-fichiers", name: "Nouvelle fenêtre Fichiers", available: true },
        {
          id: "new-folder",
          name: "Nouveau dossier",
          available: true,
          shortcut: "⇧⌘N",
        },
        {
          name: "Nouveau dossier intelligent",
          available: false,
        },
        d(),
        {
          id: "open-selected",
          name: "Ouvrir",
          available: fichiersActive,
          shortcut: "⌘O",
        },
        { name: "Ouvrir avec", available: false },
        { name: "Imprimer", available: false },
        {
          id: "close-window",
          name: "Fermer la fenêtre",
          available: canWin,
          shortcut: "⌘W",
        },
        d(),
        {
          id: "get-info",
          name: "Obtenir des infos",
          available: fichiersActive,
          shortcut: "⌘I",
        },
        {
          id: "rename",
          name: "Renommer",
          available: fichiersActive,
        },
        {
          id: "duplicate",
          name: "Dupliquer",
          available: fichiersActive,
          shortcut: "⌘D",
        },
        { name: "Créer un alias", available: false },
        {
          id: "trash",
          name: "Déplacer vers la corbeille",
          available: fichiersActive,
          shortcut: "⌘⌫",
        },
        { name: "Éjecter", available: false },
        d(),
        {
          id: "search",
          name: "Rechercher",
          available: true,
          shortcut: "⌘F",
        },
      ];
    case "edit":
      return [
        { id: "undo", name: "Annuler", available: true, shortcut: "⌘Z" },
        { id: "redo", name: "Rétablir", available: true, shortcut: "⇧⌘Z" },
        d(),
        {
          id: "cut",
          name: "Couper",
          available: fichiersActive,
          shortcut: "⌘X",
        },
        {
          id: "copy",
          name: "Copier",
          available: fichiersActive,
          shortcut: "⌘C",
        },
        {
          id: "paste",
          name: "Coller",
          available: fichiersActive,
          shortcut: "⌘V",
        },
        {
          id: "select-all",
          name: "Sélectionner tout",
          available: fichiersActive,
          shortcut: "⌘A",
        },
        d(),
        { id: "clipboard", name: "Afficher le presse-papiers", available: true },
        { name: "Démarrer Dictée", available: false },
        { id: "emoji", name: "Emojis et symboles", available: true },
      ];
    case "view":
      return [
        {
          id: "view-icons",
          name: "en icônes",
          available: true,
        },
        {
          id: "view-list",
          name: "en liste",
          available: true,
        },
        {
          id: "view-columns",
          name: "en colonnes",
          available: true,
        },
        {
          id: "view-gallery",
          name: "en galerie",
          available: true,
        },
        d(),
        { id: "sort-name", name: "Trier par nom", available: true },
        { id: "cleanup", name: "Ranger le Bureau", available: true },
        d(),
        {
          name: "Afficher la barre latérale",
          available: false,
        },
        {
          name: "Afficher la barre de chemin",
          available: false,
        },
        {
          name: "Afficher la barre d’état",
          available: false,
        },
      ];
    case "go":
      return [
        {
          id: "go-back",
          name: "Retour",
          available: fichiersActive,
          shortcut: "⌘[",
        },
        {
          id: "go-forward",
          name: "Avancer",
          available: fichiersActive,
          shortcut: "⌘]",
        },
        d(),
        { id: "go-recents", name: "Récents", available: true },
        { id: "go-documents", name: "Documents", available: true },
        { id: "go-desktop", name: "Bureau", available: true },
        { id: "go-downloads", name: "Téléchargements", available: true },
        { id: "go-trash", name: "Corbeille", available: true },
        { id: "go-disk", name: "Ordinateur", available: true },
        { id: "go-airdrop", name: "Partage NXG", available: true },
        { id: "go-network", name: "Réseau", available: true },
        { id: "go-drive", name: "NXG Drive", available: true },
        { id: "go-apps", name: "Applications", available: true },
        d(),
        { id: "go-folder", name: "Aller au dossier…", available: true },
        { id: "go-server", name: "Se connecter au serveur…", available: true },
      ];
    case "windows":
      return [
        {
          id: "minimize",
          name: "Réduire",
          available: canWin,
          shortcut: "⌘M",
        },
        {
          id: "maximize",
          name: "Zoom",
          available: canWin,
        },
        d(),
        {
          id: "cycle-windows",
          name: "Parcourir les fenêtres",
          available: true,
          shortcut: "⌘`",
        },
        d(),
        {
          id: "bring-front",
          name: "Tout ramener au premier plan",
          available: true,
        },
      ];
    case "help":
      return [
        { id: "feedback", name: "Envoyer un retour Fichiers", available: true },
        d(),
        { id: "help-nxgos", name: "Aide NXGos", available: true },
      ];
    default:
      return [];
  }
};

export default getDropdownContent;
