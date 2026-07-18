import { loadFs, SPECIAL } from "../../apps/fichiers/fs";
import { DesktopIcon, snapDesktopPosition } from "../Dock/dockApps";

/**
 * Keep desktop folder icons in sync with Fichiers → Bureau.
 * Apps on the desktop stay as dock/desktop projections (not FS nodes).
 */
export function reconcileDesktopFolders(icons: DesktopIcon[]): DesktopIcon[] {
  const nodes = loadFs();
  const folders = nodes.filter(
    (n) =>
      n.parentId === SPECIAL.desktop &&
      n.kind === "folder" &&
      n.id !== SPECIAL.trash
  );
  const folderIds = new Set(folders.map((f) => f.id));
  const folderById = new Map(folders.map((f) => [f.id, f]));

  // Drop orphan folder icons + sync names / icon asset
  let next = icons
    .filter((icon) => {
      if (icon.kind !== "folder" || !icon.folderId) return true;
      return folderIds.has(icon.folderId);
    })
    .map((icon) => {
      if (icon.kind !== "folder" || !icon.folderId) return icon;
      const folder = folderById.get(icon.folderId);
      if (!folder) return icon;
      const name = folder.name !== icon.name ? folder.name : icon.name;
      const asset = icon.icon === "finder.png" ? icon.icon : "finder.png";
      if (name === icon.name && asset === icon.icon) return icon;
      return { ...icon, name, icon: asset };
    });

  const present = new Set(
    next
      .filter((i) => i.kind === "folder" && i.folderId)
      .map((i) => i.folderId as string)
  );

  folders.forEach((folder, i) => {
    if (present.has(folder.id)) return;
    const pos = snapDesktopPosition(40 + (next.length + i) * 96, 72);
    next = [
      ...next,
      {
        id: `desktop-folder-${folder.id}`,
        name: folder.name,
        icon: "finder.png",
        kind: "folder" as const,
        folderId: folder.id,
        x: pos.x,
        y: pos.y,
      },
    ];
  });

  return next;
}

/** True if reconcile changed anything meaningful. */
export function desktopFoldersNeedUpdate(
  before: DesktopIcon[],
  after: DesktopIcon[]
): boolean {
  if (before.length !== after.length) return true;
  for (let i = 0; i < before.length; i++) {
    const a = before[i];
    const b = after[i];
    if (a.id !== b.id || a.name !== b.name || a.folderId !== b.folderId || a.kind !== b.kind || a.icon !== b.icon) {
      return true;
    }
  }
  return false;
}
