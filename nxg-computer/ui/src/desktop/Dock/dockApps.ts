export type DockApp = {
  id: string;
  name: string;
  icon: string;
};

export type DesktopIcon = {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  kind?: "app" | "folder";
  folderId?: string;
};

export type ContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  target: "desktop" | "icon";
  targetId?: string;
};

export const APP_CATALOG: DockApp[] = [
  { id: "fichiers", name: "Fichiers", icon: "fichiers.png" },
  { id: "parametres", name: "Paramètres", icon: "parametres.png" },
  { id: "photos", name: "Photos", icon: "photos.png" },
  { id: "calculator", name: "Calculator", icon: "calculator.png" },
  { id: "calendar", name: "Calendar", icon: "calendar.png" },
  { id: "vscode", name: "VSCode", icon: "vscode.png" },
  { id: "music", name: "Music", icon: "applemusic.png" },
  { id: "weather", name: "Weather", icon: "weather.png" },
  { id: "github", name: "GitHub", icon: "github.png" },
  { id: "scalable", name: "Scalable", icon: "scalable.png" },
  { id: "twitter", name: "Twitter", icon: "twitter.png" },
];

/** Apps that must stay available in the dock unless explicitly on the desktop. */
export const PINNED_CORE_APPS = ["fichiers", "parametres"] as const;

export function ensureCoreDockApps(
  dockApps: DockApp[],
  desktopIcons: { id: string; kind?: string }[] = []
): DockApp[] {
  const map = catalogMap();
  const onDesktop = new Set(
    desktopIcons.filter((i) => i.kind !== "folder").map((i) => i.id)
  );
  const next = [...dockApps];
  const present = new Set(next.map((a) => a.id));

  for (const id of PINNED_CORE_APPS) {
    if (present.has(id) || onDesktop.has(id)) continue;
    const app = map.get(id);
    if (!app) continue;
    // Insert Paramètres right after Fichiers when possible
    if (id === "parametres") {
      const fi = next.findIndex((a) => a.id === "fichiers");
      next.splice(fi >= 0 ? fi + 1 : 0, 0, app);
    } else {
      next.unshift(app);
    }
    present.add(id);
  }

  return next;
}

export const DEFAULT_DOCK_APPS = APP_CATALOG;

export const DOCK_ORDER_KEY = "nxg-dock-order";
export const DESKTOP_ICONS_KEY = "nxg-desktop-icons";

const catalogMap = () => new Map(APP_CATALOG.map((app) => [app.id, app]));

export function loadDesktopIcons(): DesktopIcon[] {
  try {
    const raw = localStorage.getItem(DESKTOP_ICONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DesktopIcon[];
    const map = catalogMap();
    return parsed
      .map((icon): DesktopIcon | null => {
        if (icon.kind === "folder") {
          return {
            id: icon.id,
            name: icon.name || "Sans titre",
            icon: icon.icon || "fichiers.png",
            x: typeof icon.x === "number" ? icon.x : 40,
            y: typeof icon.y === "number" ? icon.y : 80,
            kind: "folder",
            folderId: icon.folderId || icon.id,
          };
        }
        const appId = icon.id === "finder" ? "fichiers" : icon.id;
        const app = map.get(appId);
        if (!app) return null;
        return {
          ...app,
          kind: "app",
          x: typeof icon.x === "number" ? icon.x : 40,
          y: typeof icon.y === "number" ? icon.y : 80,
        };
      })
      .filter((x): x is DesktopIcon => x !== null);
  } catch {
    return [];
  }
}

export function saveDesktopIcons(icons: DesktopIcon[]) {
  localStorage.setItem(DESKTOP_ICONS_KEY, JSON.stringify(icons));
}

export function loadDockOrder(
  desktopIcons: DesktopIcon[] = loadDesktopIcons()
): DockApp[] {
  const map = catalogMap();
  const onDesktop = new Set(
    desktopIcons.filter((i) => i.kind !== "folder").map((i) => i.id)
  );

  try {
    const raw = localStorage.getItem(DOCK_ORDER_KEY);
    let ordered: DockApp[] = [];

    if (raw) {
      let ids: string[] = JSON.parse(raw);
      ids = ids.map((id) => (id === "finder" ? "fichiers" : id));
      ordered = ids
        .map((id) => map.get(id))
        .filter((app): app is DockApp => Boolean(app))
        .filter((app) => !onDesktop.has(app.id));
    } else {
      ordered = APP_CATALOG.filter((app) => !onDesktop.has(app.id));
    }

    APP_CATALOG.forEach((app) => {
      if (!onDesktop.has(app.id) && !ordered.find((o) => o.id === app.id)) {
        ordered.push(app);
      }
    });

    return ensureCoreDockApps(ordered, desktopIcons);
  } catch {
    return ensureCoreDockApps(
      APP_CATALOG.filter((app) => !onDesktop.has(app.id)),
      desktopIcons
    );
  }
}

export function saveDockOrder(apps: DockApp[]) {
  localStorage.setItem(
    DOCK_ORDER_KEY,
    JSON.stringify(apps.map((app) => app.id))
  );
}

export function isOverDock(clientX: number, clientY: number) {
  const dock = document.querySelector(".dock");
  if (!dock) {
    return clientY >= window.innerHeight - 110;
  }
  const r = dock.getBoundingClientRect();
  const padX = 28;
  const padTop = 64;
  const padBottom = 28;
  return (
    clientX >= r.left - padX &&
    clientX <= r.right + padX &&
    clientY >= r.top - padTop &&
    clientY <= r.bottom + padBottom
  );
}

/** Index at which to insert an app based on pointer X over the dock. */
export function dockInsertIndex(clientX: number): number {
  const items = Array.from(document.querySelectorAll(".dock .dock-item"));
  if (!items.length) return 0;
  for (let i = 0; i < items.length; i++) {
    const r = items[i].getBoundingClientRect();
    const mid = r.left + r.width / 2;
    if (clientX < mid) return i;
  }
  return items.length;
}

export function snapDesktopPosition(x: number, y: number) {
  const minX = 24;
  const minY = 48;
  const maxX = window.innerWidth - 100;
  const maxY = window.innerHeight - 140;
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

export function cleanupDesktopGrid(icons: DesktopIcon[]): DesktopIcon[] {
  const startX = 36;
  const startY = 56;
  const gapX = 96;
  const gapY = 100;
  const cols = Math.max(1, Math.floor((window.innerWidth - 120) / gapX));

  return [...icons]
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .map((icon, index) => ({
      ...icon,
      x: startX + (index % cols) * gapX,
      y: startY + Math.floor(index / cols) * gapY,
    }));
}
