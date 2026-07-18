export type DockApp = {
  id: string;
  name: string;
  icon: string;
};

export type StoreAppMeta = DockApp & {
  blurb: string;
  category: string;
  sizeLabel: string;
  /** Always present — cannot uninstall via App Store. */
  system?: boolean;
};

/** Full catalog of NXGos apps (installed or not). */
export const FULL_APP_CATALOG: StoreAppMeta[] = [
  {
    id: "fichiers",
    name: "Fichiers",
    icon: "fichiers.png",
    blurb: "Explorateur de fichiers NXGos",
    category: "Système",
    sizeLabel: "12 Mo",
    system: true,
  },
  {
    id: "parametres",
    name: "Paramètres",
    icon: "parametres.png",
    blurb: "Réglages du système",
    category: "Système",
    sizeLabel: "8 Mo",
    system: true,
  },
  {
    id: "corbeille",
    name: "Corbeille",
    icon: "corbeille.png",
    blurb: "Éléments supprimés",
    category: "Système",
    sizeLabel: "2 Mo",
    system: true,
  },
  {
    id: "appstore",
    name: "App Store",
    icon: "appstore.png",
    blurb: "Installer et gérer les applications",
    category: "Système",
    sizeLabel: "18 Mo",
    system: true,
  },
  {
    id: "calculator",
    name: "Calculatrice",
    icon: "calculator.png",
    blurb: "Calculs rapides",
    category: "Utilitaires",
    sizeLabel: "4 Mo",
  },
  {
    id: "notes",
    name: "Notes",
    icon: "notes.png",
    blurb: "Prendre des notes et les organiser",
    category: "Productivité",
    sizeLabel: "22 Mo",
  },
  {
    id: "photos",
    name: "Photos",
    icon: "photos.png",
    blurb: "Galerie et albums",
    category: "Créativité",
    sizeLabel: "48 Mo",
  },
  {
    id: "web",
    name: "Web",
    icon: "web.png",
    blurb: "Navigateur pour rechercher sur le web",
    category: "Internet",
    sizeLabel: "64 Mo",
  },
  {
    id: "musique",
    name: "Musique",
    icon: "musique.png",
    blurb: "Lire une piste via son URL",
    category: "Divertissement",
    sizeLabel: "36 Mo",
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: "terminal.png",
    blurb: "Console hacker pour le RP",
    category: "Développeur",
    sizeLabel: "9 Mo",
  },
  {
    id: "plans",
    name: "Plans",
    icon: "plans.png",
    blurb: "Carte de Los Santos (GTA)",
    category: "Navigation",
    sizeLabel: "120 Mo",
  },
  {
    id: "calendrier",
    name: "Calendrier",
    icon: "calendar.png",
    blurb: "Agenda et événements",
    category: "Productivité",
    sizeLabel: "28 Mo",
  },
  {
    id: "mail",
    name: "Mail",
    icon: "mail.png",
    blurb: "Boîte de réception NXG",
    category: "Productivité",
    sizeLabel: "42 Mo",
  },
];

export const SYSTEM_APP_IDS = FULL_APP_CATALOG.filter((a) => a.system).map(
  (a) => a.id
);

/** Default set after first boot — everything usable out of the box. */
export const DEFAULT_INSTALLED_IDS = FULL_APP_CATALOG.map((a) => a.id);

const INSTALLED_KEY = "nxg-installed-apps";

export function loadInstalledIds(): string[] {
  try {
    const raw = localStorage.getItem(INSTALLED_KEY);
    if (!raw) {
      saveInstalledIds(DEFAULT_INSTALLED_IDS);
      return [...DEFAULT_INSTALLED_IDS];
    }
    const parsed = JSON.parse(raw) as string[];
    const valid = new Set(FULL_APP_CATALOG.map((a) => a.id));
    const next = Array.from(
      new Set([...SYSTEM_APP_IDS, ...parsed.filter((id) => valid.has(id))])
    );
    return next;
  } catch {
    return [...DEFAULT_INSTALLED_IDS];
  }
}

export function saveInstalledIds(ids: string[]) {
  const valid = new Set(FULL_APP_CATALOG.map((a) => a.id));
  const next = Array.from(
    new Set([...SYSTEM_APP_IDS, ...ids.filter((id) => valid.has(id))])
  );
  localStorage.setItem(INSTALLED_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("nxg-apps-installed"));
  window.dispatchEvent(new Event("nxg-memory-dirty"));
  return next;
}

export function isAppInstalled(id: string, installed = loadInstalledIds()) {
  return installed.includes(id);
}

export function installApp(id: string): string[] {
  const meta = FULL_APP_CATALOG.find((a) => a.id === id);
  if (!meta) return loadInstalledIds();
  const cur = loadInstalledIds();
  if (cur.includes(id)) return cur;
  return saveInstalledIds([...cur, id]);
}

export function uninstallApp(id: string): string[] {
  const meta = FULL_APP_CATALOG.find((a) => a.id === id);
  if (!meta || meta.system) return loadInstalledIds();
  return saveInstalledIds(loadInstalledIds().filter((x) => x !== id));
}

export function getStoreMeta(id: string) {
  return FULL_APP_CATALOG.find((a) => a.id === id);
}

export function catalogAsDockApps(): DockApp[] {
  return FULL_APP_CATALOG.map(({ id, name, icon }) => ({ id, name, icon }));
}

export function installedDockApps(installed = loadInstalledIds()): DockApp[] {
  const map = new Map(FULL_APP_CATALOG.map((a) => [a.id, a]));
  return installed
    .map((id) => map.get(id))
    .filter((a): a is StoreAppMeta => Boolean(a))
    .map(({ id, name, icon }) => ({ id, name, icon }));
}
