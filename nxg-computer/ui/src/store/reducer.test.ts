import reducer from "./reducer";
import initialState from "./initialState";

describe("dock/ADD", () => {
  it("rejects folder-like ids", () => {
    const next = reducer(initialState, {
      type: "dock/ADD",
      payload: {
        id: "desktop-folder-abc",
        name: "Nouveau dossier",
        icon: "fichiers.png",
      },
    });
    expect(next.dockApps.map((a: { id: string }) => a.id)).not.toContain(
      "desktop-folder-abc"
    );
  });

  it("adds catalog apps", () => {
    const withoutCalc = {
      ...initialState,
      dockApps: initialState.dockApps.filter(
        (a: { id: string }) => a.id !== "calculator"
      ),
    };
    const next = reducer(withoutCalc, {
      type: "dock/ADD",
      payload: {
        id: "calculator",
        name: "Calculatrice",
        icon: "calculator.png",
      },
      index: 0,
    });
    expect(next.dockApps[0].id).toBe("calculator");
  });

  it("does not duplicate", () => {
    const next = reducer(initialState, {
      type: "dock/ADD",
      payload: {
        id: "fichiers",
        name: "Fichiers",
        icon: "fichiers.png",
      },
    });
    const count = next.dockApps.filter(
      (a: { id: string }) => a.id === "fichiers"
    ).length;
    expect(count).toBe(1);
  });
});

describe("dock/REMOVE", () => {
  it("protects core apps not on desktop", () => {
    const next = reducer(initialState, {
      type: "dock/REMOVE",
      payload: "fichiers",
    });
    expect(next.dockApps.some((a: { id: string }) => a.id === "fichiers")).toBe(
      true
    );
  });

  it("allows removing calculator", () => {
    const next = reducer(initialState, {
      type: "dock/REMOVE",
      payload: "calculator",
    });
    expect(
      next.dockApps.some((a: { id: string }) => a.id === "calculator")
    ).toBe(false);
  });
});

describe("desktop icon move", () => {
  it("moves icon to bottom corner coords", () => {
    const withIcon = {
      ...initialState,
      desktopIcons: [
        {
          id: "calculator",
          name: "Calculatrice",
          icon: "calculator.png",
          kind: "app" as const,
          x: 40,
          y: 80,
        },
      ],
    };
    const next = reducer(withIcon, {
      type: "desktop/MOVE_ICON",
      payload: { id: "calculator", x: 12, y: 700 },
    });
    expect(next.desktopIcons[0].x).toBe(12);
    expect(next.desktopIcons[0].y).toBe(700);
  });
});

describe("apps open calculator", () => {
  it("opens and focuses calculator", () => {
    const next = reducer(initialState, {
      type: "apps/OPEN",
      payload: "calculator",
    }) as typeof initialState;
    expect(next.openApps.calculator).toBe(true);
    expect(next.onTop).toBe("calculator");
  });
});
