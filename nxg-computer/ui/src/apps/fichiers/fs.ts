export type FsKind = "folder" | "file";

/** Desktop app shortcut parked in the Corbeille. */
export type TrashedDesktopApp = {
  id: string;
  name: string;
  icon: string;
};

export type FsNode = {
  id: string;
  name: string;
  kind: FsKind;
  parentId: string | null;
  createdAt: number;
  size?: number;
  ext?: string;
  /** Parent folder before move to Corbeille — used by restore. */
  trashedFrom?: string | null;
  /** When set, this trash entry is a desktop app shortcut (not a real file). */
  desktopApp?: TrashedDesktopApp;
};

export type SidebarId =
  | "recents"
  | "downloads"
  | "documents"
  | "desktop"
  | "trash"
  | "disk";

export const FS_STORAGE_KEY = "nxg-fichiers-fs-v1";

let fsScopeKey = FS_STORAGE_KEY;

/** Scope filesystem cache to a computer + user pair. */
export function setFsScope(computerId: string, userId: string) {
  fsScopeKey = `nxg-fichiers-fs:${computerId}::${userId}`;
}

export function getFsScopeKey() {
  return fsScopeKey;
}

export const SPECIAL = {
  disk: "disk-root",
  downloads: "folder-downloads",
  documents: "folder-documents",
  desktop: "folder-desktop",
  trash: "folder-trash",
} as const;

export function createId(prefix = "node") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function buildDefaultFs(): FsNode[] {
  const now = Date.now();
  return [
    {
      id: SPECIAL.disk,
      name: "Disque NXG",
      kind: "folder",
      parentId: null,
      createdAt: now,
    },
    {
      id: SPECIAL.downloads,
      name: "Téléchargements",
      kind: "folder",
      parentId: SPECIAL.disk,
      createdAt: now,
    },
    {
      id: SPECIAL.documents,
      name: "Documents",
      kind: "folder",
      parentId: SPECIAL.disk,
      createdAt: now,
    },
    {
      id: SPECIAL.desktop,
      name: "Bureau",
      kind: "folder",
      parentId: SPECIAL.disk,
      createdAt: now,
    },
    {
      id: SPECIAL.trash,
      name: "Corbeille",
      kind: "folder",
      parentId: SPECIAL.disk,
      createdAt: now,
    },
  ];
}

/** Seed demo files shipped in early builds — strip on load. */
const FAKE_FS_IDS = new Set([
  "file-welcome",
  "file-rapport",
  "file-facture",
  "file-photo",
  "file-notes",
  "folder-projets",
]);

export function sanitizeFs(nodes: FsNode[]): FsNode[] {
  const cleaned = nodes.filter((n) => !FAKE_FS_IDS.has(n.id));
  const ids = new Set(cleaned.map((n) => n.id));
  // Ensure special folders always exist
  const defaults = buildDefaultFs();
  for (const folder of defaults) {
    if (!ids.has(folder.id)) cleaned.push(folder);
  }
  return cleaned;
}

export function loadFs(): FsNode[] {
  try {
    let raw = localStorage.getItem(fsScopeKey);
    if (!raw && fsScopeKey !== FS_STORAGE_KEY) {
      raw = localStorage.getItem(FS_STORAGE_KEY);
    }
    if (!raw) {
      const fresh = buildDefaultFs();
      localStorage.setItem(fsScopeKey, JSON.stringify(fresh));
      return fresh;
    }
    const nodes = sanitizeFs(JSON.parse(raw) as FsNode[]);
    localStorage.setItem(fsScopeKey, JSON.stringify(nodes));
    return nodes;
  } catch {
    return buildDefaultFs();
  }
}

export function saveFs(nodes: FsNode[]) {
  localStorage.setItem(fsScopeKey, JSON.stringify(sanitizeFs(nodes)));
}

/** Save + broadcast to desktop, Paramètres, memory. */
export function commitFs(nodes: FsNode[]): FsNode[] {
  const cleaned = sanitizeFs(nodes);
  saveFs(cleaned);
  window.dispatchEvent(new Event("nxg-fs-changed"));
  window.dispatchEvent(new Event("nxg-memory-dirty"));
  return cleaned;
}

export function getChildren(nodes: FsNode[], parentId: string) {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name, "fr");
    });
}

export function getNode(nodes: FsNode[], id: string) {
  return nodes.find((n) => n.id === id);
}

export function getPath(nodes: FsNode[], folderId: string): FsNode[] {
  const path: FsNode[] = [];
  let current = getNode(nodes, folderId);
  while (current) {
    path.unshift(current);
    current = current.parentId
      ? getNode(nodes, current.parentId)
      : undefined;
  }
  return path;
}

export function sidebarTarget(id: SidebarId): string {
  switch (id) {
    case "downloads":
      return SPECIAL.downloads;
    case "documents":
      return SPECIAL.documents;
    case "desktop":
      return SPECIAL.desktop;
    case "trash":
      return SPECIAL.trash;
    case "disk":
    case "recents":
    default:
      return SPECIAL.disk;
  }
}

export function removeNodeDeep(nodes: FsNode[], id: string): FsNode[] {
  const toRemove = new Set<string>();
  const walk = (nodeId: string) => {
    toRemove.add(nodeId);
    nodes.forEach((n) => {
      if (n.parentId === nodeId) walk(n.id);
    });
  };
  walk(id);
  return nodes.filter((n) => !toRemove.has(n.id));
}

export function formatSize(bytes?: number) {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fileIconLabel(node: FsNode) {
  if (node.desktopApp || node.ext === "app") return "📦";
  if (node.kind === "folder") return "📁";
  switch (node.ext) {
    case "pdf":
      return "📄";
    case "jpg":
    case "png":
    case "webp":
      return "🖼️";
    case "md":
    case "txt":
      return "📝";
    default:
      return "📄";
  }
}
