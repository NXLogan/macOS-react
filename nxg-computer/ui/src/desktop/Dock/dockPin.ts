import {
  APP_CATALOG,
  DockApp,
  PINNED_CORE_APPS,
  snapDesktopPosition,
} from "./dockApps";

type Dispatch = (action: { type: string; payload?: any; index?: number }) => void;

type PinState = {
  dockApps: DockApp[];
  desktopIcons: {
    id: string;
    name: string;
    icon: string;
    kind?: string;
    x?: number;
    y?: number;
  }[];
};

/** Pin app into dock and remove from desktop — used by Paramètres + desktop drop. */
export function pinAppToDock(
  dispatch: Dispatch,
  state: PinState,
  app: DockApp,
  index?: number
) {
  const catalog = APP_CATALOG.find((a) => a.id === app.id) || app;
  dispatch({ type: "desktop/REMOVE_ICON", payload: catalog.id });
  if (!state.dockApps.some((a) => a.id === catalog.id)) {
    dispatch({
      type: "dock/ADD",
      payload: catalog,
      index,
    });
  }
}

/**
 * Unpin from dock and place on desktop so Paramètres ↔ Dock ↔ Bureau stay aligned.
 * Core apps (Fichiers / Paramètres) stay pinned unless already on desktop.
 */
export function unpinAppFromDock(
  dispatch: Dispatch,
  state: PinState,
  id: string
): { ok: boolean; reason?: string } {
  if ((PINNED_CORE_APPS as readonly string[]).includes(id)) {
    return { ok: false, reason: "Cette app système reste dans la barre" };
  }

  const app =
    state.dockApps.find((a) => a.id === id) ||
    APP_CATALOG.find((a) => a.id === id);
  if (!app) return { ok: false, reason: "App introuvable" };

  if (state.dockApps.length <= 1) {
    return { ok: false, reason: "Garde au moins une app dans la barre" };
  }

  dispatch({ type: "dock/REMOVE", payload: id });

  if (!state.desktopIcons.some((i) => i.id === id && i.kind !== "folder")) {
    const pos = snapDesktopPosition(
      Math.max(40, window.innerWidth / 2 - 40),
      Math.max(80, window.innerHeight / 2 - 40)
    );
    dispatch({
      type: "desktop/ADD_ICON",
      payload: {
        id: app.id,
        name: app.name,
        icon: app.icon,
        kind: "app",
        x: pos.x,
        y: pos.y,
      },
    });
  }

  return { ok: true };
}
