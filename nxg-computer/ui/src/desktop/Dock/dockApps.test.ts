import {
  canDockDesktopIcon,
  isOverDock,
  snapDesktopPosition,
  APP_CATALOG,
} from "./dockApps";

describe("canDockDesktopIcon", () => {
  it("allows catalog apps", () => {
    expect(canDockDesktopIcon({ id: "calculator", kind: "app" })).toBe(true);
    expect(canDockDesktopIcon({ id: "fichiers" })).toBe(true);
    expect(canDockDesktopIcon({ id: "parametres" })).toBe(true);
  });

  it("rejects folders", () => {
    expect(
      canDockDesktopIcon({ id: "desktop-folder-x", kind: "folder" })
    ).toBe(false);
  });

  it("rejects unknown ids", () => {
    expect(canDockDesktopIcon({ id: "not-an-app" })).toBe(false);
  });
});

describe("snapDesktopPosition", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    document.body.innerHTML = "";
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it("keeps bottom-left corner on screen", () => {
    const pos = snapDesktopPosition(10, 720);
    expect(pos.x).toBeGreaterThanOrEqual(8);
    expect(pos.y).toBeGreaterThanOrEqual(40);
    expect(pos.x).toBeLessThan(1280 - 80);
    expect(pos.y).toBeLessThan(800 - 80);
  });

  it("keeps bottom-right corner on screen", () => {
    const pos = snapDesktopPosition(1200, 740);
    expect(pos.x).toBeLessThanOrEqual(1280 - 84 - 8);
    expect(pos.y).toBeLessThanOrEqual(800 - 92 - 8);
    expect(pos.x).toBeGreaterThan(100);
  });

  it("clamps far off-screen coords", () => {
    const pos = snapDesktopPosition(-200, 5000);
    expect(pos.x).toBe(8);
    expect(pos.y).toBeLessThanOrEqual(800 - 92 - 8);
  });

  it("nudges away when overlapping dock bar", () => {
    const dock = document.createElement("div");
    dock.className = "dock";
    Object.defineProperty(dock, "getBoundingClientRect", {
      value: () => ({
        left: 500,
        right: 780,
        top: 720,
        bottom: 788,
        width: 280,
        height: 68,
        x: 500,
        y: 720,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(dock);

    const pos = snapDesktopPosition(560, 730);
    // Must not stay fully under the dock bar
    const underDock =
      pos.x + 84 > 500 && pos.x < 780 && pos.y + 92 > 720 && pos.y < 788;
    expect(underDock).toBe(false);
  });
});

describe("isOverDock", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns false without a dock", () => {
    expect(isOverDock(100, 700)).toBe(false);
  });

  it("returns true only over the dock bar", () => {
    const dock = document.createElement("div");
    dock.className = "dock";
    Object.defineProperty(dock, "getBoundingClientRect", {
      value: () => ({
        left: 500,
        right: 780,
        top: 720,
        bottom: 788,
        width: 280,
        height: 68,
        x: 500,
        y: 720,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(dock);

    expect(isOverDock(640, 750)).toBe(true);
    // Bottom-left corner of screen — must NOT count as dock
    expect(isOverDock(40, 760)).toBe(false);
    // Bottom-right corner
    expect(isOverDock(1200, 760)).toBe(false);
  });
});

describe("APP_CATALOG", () => {
  it("includes core apps", () => {
    const ids = APP_CATALOG.map((a) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining(["fichiers", "parametres", "calculator"])
    );
  });
});
