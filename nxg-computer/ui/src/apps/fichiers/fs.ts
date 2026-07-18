export type FsKind = "folder" | "file";

export type FsNode = {
  id: string;
  name: string;
  kind: FsKind;
  parentId: string | null;
  createdAt: number;
  size?: number;
  ext?: string;
};

export type SidebarId =
  | "recents"
  | "downloads"
  | "documents"
  | "desktop"
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
      id: "file-welcome",
      name: "Bienvenue.txt",
      kind: "file",
      parentId: SPECIAL.documents,
      createdAt: now - 86400000,
      size: 1280,
      ext: "txt",
    },
    {
      id: "file-rapport",
      name: "Rapport_NXG.pdf",
      kind: "file",
      parentId: SPECIAL.documents,
      createdAt: now - 172800000,
      size: 245760,
      ext: "pdf",
    },
    {
      id: "file-facture",
      name: "Facture_mars.pdf",
      kind: "file",
      parentId: SPECIAL.downloads,
      createdAt: now - 3600000,
      size: 89400,
      ext: "pdf",
    },
    {
      id: "file-photo",
      name: "Photo_LosSantos.jpg",
      kind: "file",
      parentId: SPECIAL.downloads,
      createdAt: now - 7200000,
      size: 2048000,
      ext: "jpg",
    },
    {
      id: "file-notes",
      name: "Notes.md",
      kind: "file",
      parentId: SPECIAL.desktop,
      createdAt: now - 43200000,
      size: 4200,
      ext: "md",
    },
    {
      id: "folder-projets",
      name: "Projets",
      kind: "folder",
      parentId: SPECIAL.documents,
      createdAt: now - 259200000,
    },
  ];
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
    const nodes = JSON.parse(raw) as FsNode[];
    if (fsScopeKey !== FS_STORAGE_KEY) {
      localStorage.setItem(fsScopeKey, JSON.stringify(nodes));
    }
    return nodes;
  } catch {
    return buildDefaultFs();
  }
}

export function saveFs(nodes: FsNode[]) {
  localStorage.setItem(fsScopeKey, JSON.stringify(nodes));
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
    case "disk":
    case "recents":
    default:
      return SPECIAL.disk;
  }
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
