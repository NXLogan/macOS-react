import initialState from "./initialState";
import getDate from "../utils/helpers/getDate";
import {
  ensureCoreDockApps,
  APP_CATALOG,
  PINNED_CORE_APPS,
  sanitizeDockApps,
} from "../desktop/Dock/dockApps";
import {
  bumpWindowOrder,
  removeFromWindowOrder,
} from "../desktop/WindowChrome/windowStack";

type AnyAction = {
  type: string;
  payload?: any;
  index?: number;
  [key: string]: any;
};

const reducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case "query/SEARCH":
      return {
        ...state,
        query: action.payload,
      };
    case "loading/START":
      return {
        ...state,
        loading: true,
      };
    case "section/SELECT":
      return {
        ...state,
        section: action.payload,
      };
    case "section/RESET":
      return {
        ...state,
        section: "none",
      };
    case "dock/SELECT":
      return {
        ...state,
        dockItem: action.payload,
      };
    case "dock/RESET":
      return {
        ...state,
        dockItem: undefined,
      };
    case "dock/REORDER":
      return {
        ...state,
        dockApps: action.payload,
      };
    case "dock/REMOVE": {
      const id = action.payload as string;
      const onDesktop = state.desktopIcons.some(
        (icon) => icon.id === id && icon.kind !== "folder"
      );
      if (
        (PINNED_CORE_APPS as readonly string[]).includes(id) &&
        !onDesktop
      ) {
        return state;
      }
      return {
        ...state,
        dockApps: ensureCoreDockApps(
          state.dockApps.filter((app) => app.id !== id),
          state.desktopIcons
        ),
      };
    }
    case "dock/ADD":
      // Never pin folders / unknown icons into the Dock
      if (
        typeof action.payload?.id !== "string" ||
        action.payload.id.startsWith("desktop-folder-") ||
        !APP_CATALOG.some((a) => a.id === action.payload.id)
      ) {
        return state;
      }
      if (state.dockApps.some((app) => app.id === action.payload.id)) {
        return state;
      }
      if (
        typeof action.index === "number" &&
        action.index >= 0 &&
        action.index <= state.dockApps.length
      ) {
        const next = [...state.dockApps];
        next.splice(action.index, 0, action.payload);
        return { ...state, dockApps: next };
      }
      return {
        ...state,
        dockApps: [...state.dockApps, action.payload],
      };
    case "desktop/SET_ICONS":
      return {
        ...state,
        desktopIcons: action.payload,
      };
    case "desktop/ADD_ICON":
      if (state.desktopIcons.some((icon) => icon.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        desktopIcons: [...state.desktopIcons, action.payload],
      };
    case "desktop/REMOVE_ICON":
      return {
        ...state,
        desktopIcons: state.desktopIcons.filter(
          (icon) => icon.id !== action.payload
        ),
      };
    case "desktop/MOVE_ICON":
      return {
        ...state,
        desktopIcons: state.desktopIcons.map((icon) =>
          icon.id === action.payload.id
            ? { ...icon, x: action.payload.x, y: action.payload.y }
            : icon
        ),
      };
    case "date/SET":
      return {
        ...state,
        date: getDate(),
      };
    case "booting/FINISH":
      return {
        ...state,
        booting: false,
        locked: true,
      };
    case "auth/UNLOCK":
      return {
        ...state,
        locked: false,
        poweredOff: false,
      };
    case "auth/LOCK":
      return {
        ...state,
        locked: true,
      };
    case "system/SHUTDOWN": {
      const closedApps: Record<string, boolean> = { ...state.openApps };
      Object.keys(closedApps).forEach((id) => {
        closedApps[id] = false;
      });
      return {
        ...state,
        openApps: closedApps,
        windowChrome: {},
        windowOrder: [],
        onTop: "wallpaper",
        locked: true,
        poweredOff: true,
        section: "none",
        settings: { ...state.settings, open: false },
        contextMenu: { ...state.contextMenu, open: false },
      };
    }
    case "system/POWER_ON":
      return {
        ...state,
        poweredOff: false,
        locked: true,
        booting: false,
      };
    case "sound/PLAY":
      return {
        ...state,
        soundPlayed: true,
      };
    case "settings/CLOSE":
      return {
        ...state,
        settings: {
          ...state.settings,
          open: false,
        },
      };
    case "settings/OPEN":
      return {
        ...state,
        settings: {
          ...state.settings,
          open: true,
        },
      };
    case "settings/SETCOLOR": {
      const color = action.payload as string;
      const accent =
        color === "babyblue"
          ? "blue"
          : color === "violet"
          ? "purple"
          : color;
      return {
        ...state,
        settings: {
          ...state.settings,
          color,
          prefs: {
            ...state.settings.prefs,
            accent: accent as typeof state.settings.prefs.accent,
          },
        },
      };
    }
    case "settings/AIRDROP":
      return {
        ...state,
        settings: {
          ...state.settings,
          airdrop: !state.settings.airdrop,
        },
      };
    case "settings/ANIMATIONS":
      return {
        ...state,
        settings: {
          ...state.settings,
          animations: !state.settings.animations,
        },
      };
    case "settings/NOTCH":
      return {
        ...state,
        settings: {
          ...state.settings,
          notch: !state.settings.notch,
        },
      };
    case "wallpaper/TOGGLE":
      return {
        ...state,
        settings: {
          ...state.settings,
          wallpaper: {
            ...state.settings.wallpaper,
            open: !state.settings.wallpaper.open,
          },
        },
      };
    case "wallpaper/CLOSE":
      return {
        ...state,
        settings: {
          ...state.settings,
          wallpaper: {
            ...state.settings.wallpaper,
            open: false,
          },
        },
      };
    case "wallpaper/OPEN":
      return {
        ...state,
        settings: {
          ...state.settings,
          wallpaper: {
            ...state.settings.wallpaper,
            open: true,
          },
        },
      };
    case "wallpaper/CHANGE":
      return {
        ...state,
        settings: {
          ...state.settings,
          wallpaper: {
            ...state.settings.wallpaper,
            // Keep window closed when changing from Paramètres / elsewhere
            open: state.settings.wallpaper.open,
            preview: action.payload.preview,
            src: action.payload.src,
            name: action.payload.name,
            surname: action.payload.surname,
            custom: Boolean(action.payload.custom),
          },
        },
      };
    case "onTop/SET":
      return {
        ...state,
        onTop: action.payload,
        windowOrder: bumpWindowOrder(
          state.windowOrder || [],
          action.payload
        ),
      };
    case "state/LOCAL":
      return {
        ...state,
        settings: {
          ...state.settings,
          wallpaper: action.payload,
        },
      };
    case "state/LOCALCOLOR":
      return {
        ...state,
        settings: {
          ...state.settings,
          color: action.payload,
        },
      };
    case "state/BOOT":
      return {
        ...state,
        booting: action.payload,
      };
    case "apps/OPEN": {
      const appId =
        typeof action.payload === "string"
          ? action.payload
          : action.payload?.id;
      const folderId = action.folderId ?? action.payload?.folderId;
      const prev = state.windowChrome[appId] || {
        minimized: false,
        maximized: false,
      };
      return {
        ...state,
        onTop: appId || state.onTop,
        windowOrder: bumpWindowOrder(state.windowOrder || [], appId),
        openApps: {
          ...state.openApps,
          [appId]: true,
        },
        windowChrome: {
          ...state.windowChrome,
          [appId]: {
            ...prev,
            minimized: false,
          },
        },
        fichiersStartId:
          appId === "fichiers"
            ? folderId ?? state.fichiersStartId
            : state.fichiersStartId,
      };
    }
    case "apps/CLOSE":
      return {
        ...state,
        openApps: {
          ...state.openApps,
          [action.payload]: false,
        },
        windowOrder: removeFromWindowOrder(
          state.windowOrder || [],
          action.payload
        ),
        windowChrome: {
          ...state.windowChrome,
          [action.payload]: { minimized: false, maximized: false },
        },
      };
    case "window/MINIMIZE":
      return {
        ...state,
        windowChrome: {
          ...state.windowChrome,
          [action.payload]: {
            minimized: true,
            maximized: false,
          },
        },
      };
    case "window/TOGGLE_MAX": {
      const prev = state.windowChrome[action.payload] || {
        minimized: false,
        maximized: false,
      };
      return {
        ...state,
        windowChrome: {
          ...state.windowChrome,
          [action.payload]: {
            minimized: false,
            maximized: !prev.maximized,
          },
        },
      };
    }
    case "window/RESTORE": {
      const prev = state.windowChrome[action.payload] || {
        minimized: false,
        maximized: false,
      };
      return {
        ...state,
        onTop: action.payload,
        windowOrder: bumpWindowOrder(
          state.windowOrder || [],
          action.payload
        ),
        windowChrome: {
          ...state.windowChrome,
          [action.payload]: {
            ...prev,
            minimized: false,
          },
        },
      };
    }
    case "fichiers/SET_START":
      return {
        ...state,
        fichiersStartId: action.payload,
      };
    case "context/OPEN":
      return {
        ...state,
        contextMenu: {
          open: true,
          x: action.payload.x,
          y: action.payload.y,
          target: action.payload.target,
          targetId: action.payload.targetId,
        },
      };
    case "prefs/PATCH": {
      const payload = action.payload || {};
      const nextPrefs = {
        ...state.settings.prefs,
        ...payload,
      };
      const nextColor =
        typeof payload.accent === "string"
          ? payload.accent
          : state.settings.color;
      return {
        ...state,
        settings: {
          ...state.settings,
          color: nextColor,
          prefs: nextPrefs,
        },
      };
    }
    case "prefs/SET":
      return {
        ...state,
        settings: {
          ...state.settings,
          prefs: action.payload,
        },
      };
    case "user/UPDATE":
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };
    case "memory/SESSION": {
      const { computerId, userId, userName } = action.payload;
      return {
        ...state,
        session: {
          ...state.session,
          computerId,
          userId,
          userName: userName || state.session.userName,
        },
      };
    }
    case "memory/HYDRATE": {
      const { session, profile } = action.payload;
      const desktopIcons = profile.desktopIcons ?? [];
      const dockApps = ensureCoreDockApps(
        sanitizeDockApps(
          profile.dockApps?.length ? profile.dockApps : state.dockApps
        ),
        desktopIcons
      );
      return {
        ...state,
        session: {
          computerId: session.computerId,
          userId: session.userId,
          userName: session.userName,
          ready: true,
        },
        user: {
          name: profile.user?.name || session.userName || state.user.name,
          password: profile.user?.password || state.user.password,
          avatar: profile.user?.avatar ?? state.user.avatar,
          phone: profile.user?.phone ?? state.user.phone,
        },
        dockApps,
        desktopIcons,
        settings: {
          ...state.settings,
          open: false,
          animations: profile.settings?.animations ?? state.settings.animations,
          color: profile.settings?.color ?? state.settings.color,
          notch: profile.settings?.notch ?? state.settings.notch,
          airdrop: profile.settings?.airdrop ?? state.settings.airdrop,
          wallpaper: {
            open: false,
            src:
              profile.settings?.wallpaper?.src ?? state.settings.wallpaper.src,
            preview:
              profile.settings?.wallpaper?.preview ??
              state.settings.wallpaper.preview,
            name:
              profile.settings?.wallpaper?.name ?? state.settings.wallpaper.name,
            surname:
              profile.settings?.wallpaper?.surname ??
              state.settings.wallpaper.surname,
            custom: Boolean(profile.settings?.wallpaper?.custom),
          },
          prefs: {
            ...state.settings.prefs,
            ...profile.settings?.prefs,
            notifications: {
              ...state.settings.prefs.notifications,
              ...profile.settings?.prefs?.notifications,
            },
            permissions: {
              ...state.settings.prefs.permissions,
              ...profile.settings?.prefs?.permissions,
            },
          },
        },
      };
    }
    case "context/CLOSE":
      return {
        ...state,
        contextMenu: {
          ...state.contextMenu,
          open: false,
        },
      };
    default:
      return state;
  }
};

export default reducer;
