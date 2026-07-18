import {
  catalogAsDockApps,
  isAppInstalled,
  loadInstalledIds,
} from "../../apps/registry";
import type { DockApp } from "../../apps/registry";

export type { DockApp };

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

/** All known apps (even uninstalled). Source: apps/registry. */
export const APP_CATALOG: DockApp[] = catalogAsDockApps();

/** Apps that can open a window today. */
export const OPENABLE_APP_IDS = [
  "fichiers",
  "parametres",
  "calculator",
  "corbeille",
  "appstore",
  "notes",
  "photos",
  "web",
  "musique",
  "terminal",
  "plans",
  "calendrier",
  "mail",
] as const;

export type OpenableAppId = (typeof OPENABLE_APP_IDS)[number];

export function isOpenableAppId(id: string): id is OpenableAppId {
  return (OPENABLE_APP_IDS as readonly string[]).includes(id);
}

/** Apps that must stay available in the dock unless explicitly on the desktop. */
export const PINNED_CORE_APPS = [
  "fichiers",
  "parametres",
  "corbeille",
  "appstore",
] as const;

/** Drop unknown / stub / uninstalled app ids. */
export function sanitizeDockApps(dockApps: DockApp[]): DockApp[] {
  const map = catalogMap();
  const installed = new Set(loadInstalledIds());
  return dockApps
    .map((app) => {
      const id = app.id === "finder" ? "fichiers" : app.id;
      return map.get(id) || null;
    })
    .filter((a): a is DockApp => Boolean(a) && installed.has(a!.id));
}

export function ensureCoreDockApps(
  dockApps: DockApp[],
  desktopIcons: { id: string; kind?: string }[] = []
): DockApp[] {
  const map = catalogMap();
  const onDesktop = new Set(
    desktopIcons.filter((i) => i.kind !== "folder").map((i) => i.id)
  );
  const next = sanitizeDockApps(dockApps);
  const present = new Set(next.map((a) => a.id));

  for (const id of PINNED_CORE_APPS) {
    if (!isAppInstalled(id)) continue;
    if (present.has(id) || onDesktop.has(id)) continue;
    const app = map.get(id);
    if (!app) continue;
    if (id === "parametres") {
      const fi = next.findIndex((a) => a.id === "fichiers");
      next.splice(fi >= 0 ? fi + 1 : 0, 0, app);
    } else if (id === "corbeille" || id === "appstore") {
      next.push(app);
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
            icon: icon.icon || "finder.png",
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
  if (!dock) return false;
  const r = dock.getBoundingClientRect();
  // Strict hitbox — only the real dock bar (not the whole bottom strip / corners)
  const pad = 10;
  return (
    clientX >= r.left - pad &&
    clientX <= r.right + pad &&
    clientY >= r.top - pad &&
    clientY <= r.bottom + pad
  );
}

/** Only real catalog apps can move from desktop → Dock (never folders). */
export function canDockDesktopIcon(icon: {
  id: string;
  kind?: string;
}): boolean {
  if (icon.kind === "folder") return false;
  return APP_CATALOG.some((a) => a.id === icon.id);
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

const ICON_W = 84;
const ICON_H = 92;

/** Free placement anywhere on the desktop; only nudges if sitting under the dock bar. */
export function snapDesktopPosition(x: number, y: number) {
  const minX = 8;
  const minY = 40;
  const maxX = Math.max(minX, window.innerWidth - ICON_W - 8);
  const maxY = Math.max(minY, window.innerHeight - ICON_H - 8);

  let nx = Math.max(minX, Math.min(maxX, x));
  let ny = Math.max(minY, Math.min(maxY, y));

  const dock = document.querySelector(".dock");
  if (dock) {
    const r = dock.getBoundingClientRect();
    const overlaps =
      nx + ICON_W > r.left &&
      nx < r.right &&
      ny + ICON_H > r.top &&
      ny < r.bottom;

    if (overlaps) {
      const above = r.top - ICON_H - 6;
      const left = r.left - ICON_W - 6;
      const right = r.right + 6;

      // Prefer the side the user aimed for (corners stay in corners)
      const mid = (r.left + r.right) / 2;
      if (x + ICON_W / 2 < mid && left >= minX) {
        nx = Math.max(minX, Math.min(maxX, left));
        ny = Math.max(minY, Math.min(maxY, y));
      } else if (x + ICON_W / 2 >= mid && right <= maxX) {
        nx = Math.max(minX, Math.min(maxX, right));
        ny = Math.max(minY, Math.min(maxY, y));
      } else if (above >= minY) {
        ny = above;
      }
    }
  }

  return { x: nx, y: ny };
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
