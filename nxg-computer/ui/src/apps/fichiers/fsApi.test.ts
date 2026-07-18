import { commitFs, loadFs, SPECIAL } from "./fs";
import {
  computeStorageBreakdown,
  createFolder,
  emptyTrash,
  renameNode,
  restoreNode,
  totalStorageBytes,
  trashDesktopApp,
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
    const trashed = loadFs().find((n) => n.id === folder.id);
    expect(trashed?.parentId).toBe(SPECIAL.trash);
    expect(trashed?.trashedFrom).toBe(SPECIAL.desktop);

    emptyTrash();
    expect(loadFs().some((n) => n.id === folder.id)).toBe(false);
  });

  it("restoreNode puts folder back on desktop", () => {
    const { folder } = createFolder(SPECIAL.desktop, "Récupérable");
    trashNode(folder.id);
    const { restored } = restoreNode(folder.id);
    expect(restored?.parentId).toBe(SPECIAL.desktop);
    expect(loadFs().find((n) => n.id === folder.id)?.parentId).toBe(
      SPECIAL.desktop
    );
    expect(loadFs().find((n) => n.id === folder.id)?.trashedFrom).toBeUndefined();
  });

  it("trashDesktopApp + restore removes stub", () => {
    trashDesktopApp({
      id: "calculator",
      name: "Calculatrice",
      icon: "calculator.png",
    });
    const stub = loadFs().find((n) => n.id === "trashed-app-calculator");
    expect(stub?.parentId).toBe(SPECIAL.trash);
    expect(stub?.desktopApp?.id).toBe("calculator");

    const { restored } = restoreNode("trashed-app-calculator");
    expect(restored?.desktopApp?.id).toBe("calculator");
    expect(loadFs().some((n) => n.id === "trashed-app-calculator")).toBe(false);
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
