import { commitFs, SPECIAL } from "../../apps/fichiers/fs";
import { createFolder, renameNode, trashNode } from "../../apps/fichiers/fsApi";
import { reconcileDesktopFolders } from "./reconcileDesktop";
import { DesktopIcon } from "../Dock/dockApps";

describe("reconcileDesktopFolders", () => {
  beforeEach(() => {
    localStorage.clear();
    commitFs([
      {
        id: SPECIAL.disk,
        name: "Disque NXG",
        kind: "folder",
        parentId: null,
        createdAt: 1,
      },
      {
        id: SPECIAL.desktop,
        name: "Bureau",
        kind: "folder",
        parentId: SPECIAL.disk,
        createdAt: 1,
      },
      {
        id: SPECIAL.documents,
        name: "Documents",
        kind: "folder",
        parentId: SPECIAL.disk,
        createdAt: 1,
      },
      {
        id: SPECIAL.downloads,
        name: "Téléchargements",
        kind: "folder",
        parentId: SPECIAL.disk,
        createdAt: 1,
      },
      {
        id: SPECIAL.trash,
        name: "Corbeille",
        kind: "folder",
        parentId: SPECIAL.disk,
        createdAt: 1,
      },
    ]);
  });

  it("adds icons for new Bureau folders", () => {
    const { folder } = createFolder(SPECIAL.desktop, "Sync");
    const next = reconcileDesktopFolders([]);
    expect(next.some((i) => i.folderId === folder.id)).toBe(true);
  });

  it("renames icons when FS renames", () => {
    const { folder } = createFolder(SPECIAL.desktop, "Old");
    const icons: DesktopIcon[] = [
      {
        id: `desktop-folder-${folder.id}`,
        name: "Old",
        icon: "finder.png",
        kind: "folder",
        folderId: folder.id,
        x: 40,
        y: 80,
      },
    ];
    renameNode(folder.id, "New");
    const next = reconcileDesktopFolders(icons);
    expect(next.find((i) => i.folderId === folder.id)?.name).toBe("New");
  });

  it("removes icons when folder leaves Bureau", () => {
    const { folder } = createFolder(SPECIAL.desktop, "Gone");
    const icons: DesktopIcon[] = [
      {
        id: `desktop-folder-${folder.id}`,
        name: "Gone",
        icon: "finder.png",
        kind: "folder",
        folderId: folder.id,
        x: 40,
        y: 80,
      },
    ];
    trashNode(folder.id);
    const next = reconcileDesktopFolders(icons);
    expect(next.some((i) => i.folderId === folder.id)).toBe(false);
  });
});
