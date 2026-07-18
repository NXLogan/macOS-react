import {
  commitFs,
  createId,
  FsNode,
  getChildren,
  loadFs,
  removeNodeDeep,
  SPECIAL,
} from "./fs";

export function createFolder(
  parentId: string,
  name = "Nouveau dossier"
): { nodes: FsNode[]; folder: FsNode } {
  const folder: FsNode = {
    id: createId("folder"),
    name: name.trim() || "Nouveau dossier",
    kind: "folder",
    parentId,
    createdAt: Date.now(),
  };
  const nodes = commitFs([...loadFs(), folder]);
  return { nodes, folder };
}

export function renameNode(id: string, name: string): FsNode[] {
  const next = name.trim();
  if (!next) return loadFs();
  return commitFs(
    loadFs().map((n) => (n.id === id ? { ...n, name: next } : n))
  );
}

export function duplicateNode(id: string): { nodes: FsNode[]; copy?: FsNode } {
  const nodes = loadFs();
  const src = nodes.find((n) => n.id === id);
  if (!src) return { nodes };
  const copy: FsNode = {
    ...src,
    id: createId(src.kind),
    name: `${src.name} copie`,
    createdAt: Date.now(),
  };
  return { nodes: commitFs([...nodes, copy]), copy };
}

/** Move into Corbeille (or hard-delete if already there). */
export function trashNode(id: string): FsNode[] {
  const nodes = loadFs();
  const node = nodes.find((n) => n.id === id);
  if (!node) return nodes;

  const protectedIds = new Set<string>(Object.values(SPECIAL));
  if (protectedIds.has(id)) return nodes;

  if (node.parentId === SPECIAL.trash) {
    return commitFs(removeNodeDeep(nodes, id));
  }

  return commitFs(
    nodes.map((n) =>
      n.id === id
        ? {
            ...n,
            trashedFrom: n.parentId,
            parentId: SPECIAL.trash,
          }
        : n
    )
  );
}

/** Park a desktop app shortcut in the Corbeille. */
export function trashDesktopApp(app: {
  id: string;
  name: string;
  icon: string;
}): FsNode[] {
  const nodes = loadFs();
  const stubId = `trashed-app-${app.id}`;
  const existing = nodes.find((n) => n.id === stubId);
  if (existing) {
    return commitFs(
      nodes.map((n) =>
        n.id === stubId
          ? {
              ...n,
              name: app.name,
              parentId: SPECIAL.trash,
              trashedFrom: SPECIAL.desktop,
              desktopApp: { id: app.id, name: app.name, icon: app.icon },
              ext: "app",
            }
          : n
      )
    );
  }
  const stub: FsNode = {
    id: stubId,
    name: app.name,
    kind: "file",
    parentId: SPECIAL.trash,
    createdAt: Date.now(),
    ext: "app",
    trashedFrom: SPECIAL.desktop,
    desktopApp: { id: app.id, name: app.name, icon: app.icon },
  };
  return commitFs([...nodes, stub]);
}

/**
 * Restore from Corbeille to previous parent (or Bureau).
 * Returns the restored node when successful.
 */
export function restoreNode(id: string): {
  nodes: FsNode[];
  restored?: FsNode;
} {
  const nodes = loadFs();
  const node = nodes.find((n) => n.id === id);
  if (!node || node.parentId !== SPECIAL.trash) {
    return { nodes };
  }

  const protectedIds = new Set<string>(Object.values(SPECIAL));
  if (protectedIds.has(id)) return { nodes };

  let targetParent = node.trashedFrom || SPECIAL.desktop;
  const targetExists = nodes.some(
    (n) => n.id === targetParent && n.kind === "folder"
  );
  if (!targetParent || targetParent === SPECIAL.trash || !targetExists) {
    targetParent = SPECIAL.desktop;
  }

  // Desktop app stubs only live in trash — drop stub; caller re-adds desktop icon
  if (node.desktopApp) {
    return {
      nodes: commitFs(removeNodeDeep(nodes, id)),
      restored: {
        ...node,
        parentId: SPECIAL.desktop,
        trashedFrom: undefined,
      },
    };
  }

  const restored: FsNode = {
    ...node,
    parentId: targetParent,
    trashedFrom: undefined,
  };

  return {
    nodes: commitFs(nodes.map((n) => (n.id === id ? restored : n))),
    restored,
  };
}

export function emptyTrash(): FsNode[] {
  const nodes = loadFs();
  const trashChildren = getChildren(nodes, SPECIAL.trash);
  let next = nodes;
  for (const child of trashChildren) {
    next = removeNodeDeep(next, child.id);
  }
  return commitFs(next);
}

export function hardDeleteNode(id: string): FsNode[] {
  const protectedIds = new Set<string>(Object.values(SPECIAL));
  if (protectedIds.has(id)) return loadFs();
  return commitFs(removeNodeDeep(loadFs(), id));
}

export function listTrash(nodes: FsNode[] = loadFs()): FsNode[] {
  return getChildren(nodes, SPECIAL.trash);
}

export function trashCount(nodes: FsNode[] = loadFs()): number {
  return listTrash(nodes).length;
}

const FOLDER_OVERHEAD = 4 * 1024;
const FILE_DEFAULT = 8 * 1024;

export type StorageBucket = {
  id: string;
  label: string;
  bytes: number;
};

function subtreeBytes(nodes: FsNode[], rootId: string): number {
  const kids = nodes.filter((n) => n.parentId === rootId);
  let total = 0;
  for (const n of kids) {
    if (n.kind === "folder") {
      total += FOLDER_OVERHEAD + subtreeBytes(nodes, n.id);
    } else {
      total += n.size && n.size > 0 ? n.size : FILE_DEFAULT;
    }
  }
  return total;
}

function isUnder(nodes: FsNode[], nodeId: string, rootId: string): boolean {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  let cur: string | undefined = nodeId || undefined;
  while (cur) {
    if (seen.has(cur)) break;
    if (cur === rootId) return true;
    seen.add(cur);
    const parentId = byId.get(cur)?.parentId;
    cur = parentId ?? undefined;
  }
  return false;
}

/** Real usage from Fichiers — Paramètres Stockage reads this. */
export function computeStorageBreakdown(
  nodes: FsNode[] = loadFs()
): StorageBucket[] {
  const knownRoots = [
    SPECIAL.desktop,
    SPECIAL.documents,
    SPECIAL.downloads,
    SPECIAL.trash,
  ];

  const buckets: StorageBucket[] = [
    {
      id: "desktop",
      label: "Bureau",
      bytes: subtreeBytes(nodes, SPECIAL.desktop),
    },
    {
      id: "documents",
      label: "Documents",
      bytes: subtreeBytes(nodes, SPECIAL.documents),
    },
    {
      id: "downloads",
      label: "Téléchargements",
      bytes: subtreeBytes(nodes, SPECIAL.downloads),
    },
    {
      id: "trash",
      label: "Corbeille",
      bytes: subtreeBytes(nodes, SPECIAL.trash),
    },
  ];

  let other = 0;
  for (const n of nodes) {
    if (n.id === SPECIAL.disk || knownRoots.includes(n.id as typeof SPECIAL.desktop)) {
      continue;
    }
    if (n.kind === "folder" && n.parentId === SPECIAL.disk) {
      other += FOLDER_OVERHEAD + subtreeBytes(nodes, n.id);
      continue;
    }
    if (n.kind !== "file") continue;
    const underKnown = knownRoots.some((root) =>
      isUnder(nodes, n.parentId || "", root)
    );
    if (!underKnown) {
      other += n.size && n.size > 0 ? n.size : FILE_DEFAULT;
    }
  }

  buckets.push({ id: "other", label: "Autre", bytes: other });
  buckets.push({
    id: "systeme",
    label: "Système NXGos",
    bytes: 48 * 1024 * 1024,
  });

  return buckets;
}

export function totalStorageBytes(
  buckets: StorageBucket[] = computeStorageBreakdown()
) {
  return buckets.reduce((a, b) => a + b.bytes, 0);
}
