import { commitFs, loadFs, SPECIAL } from "./fs";
import {
  computeStorageBreakdown,
  createFolder,
  emptyTrash,
  renameNode,
  totalStorageBytes,
  trashNode,
} from "./fsApi";

describe("fsApi sync", () => {
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
        id: SPECIAL.downloads,
        name: "Téléchargements",
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
        id: SPECIAL.desktop,
        name: "Bureau",
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

  it("createFolder on desktop persists and is loadable", () => {
    const { folder } = createFolder(SPECIAL.desktop, "Projet");
    const nodes = loadFs();
    expect(nodes.some((n) => n.id === folder.id)).toBe(true);
    expect(nodes.find((n) => n.id === folder.id)?.parentId).toBe(
      SPECIAL.desktop
    );
  });

  it("rename + trash move to Corbeille then emptyTrash", () => {
    const { folder } = createFolder(SPECIAL.desktop, "Temp");
    renameNode(folder.id, "Renommé");
    expect(loadFs().find((n) => n.id === folder.id)?.name).toBe("Renommé");

    trashNode(folder.id);
    expect(loadFs().find((n) => n.id === folder.id)?.parentId).toBe(
      SPECIAL.trash
    );

    emptyTrash();
    expect(loadFs().some((n) => n.id === folder.id)).toBe(false);
  });

  it("storage breakdown grows when files are added under Documents", () => {
    const before = totalStorageBytes(computeStorageBreakdown());
    commitFs([
      ...loadFs(),
      {
        id: "file-big",
        name: "gros.bin",
        kind: "file",
        parentId: SPECIAL.documents,
        createdAt: Date.now(),
        size: 50 * 1024 * 1024,
      },
    ]);
    const after = totalStorageBytes(computeStorageBreakdown());
    expect(after).toBeGreaterThan(before);
    const docs = computeStorageBreakdown().find((b) => b.id === "documents");
    expect(docs && docs.bytes >= 50 * 1024 * 1024).toBe(true);
  });
});
