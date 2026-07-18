import { AnyAction } from "@reduxjs/toolkit";
import initialState from "./initialState";
import getDate from "../utils/helpers/getDate";

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
    case "dock/REMOVE":
      return {
        ...state,
        dockApps: state.dockApps.filter((app) => app.id !== action.payload),
      };
    case "dock/ADD":
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
      };
    case "auth/LOCK":
      return {
        ...state,
        locked: true,
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
    case "settings/SETCOLOR":
      return {
        ...state,
        settings: {
          ...state.settings,
          color: action.payload,
        },
      };
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
            open: true,
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
      return {
        ...state,
        openApps: {
          ...state.openApps,
          [appId]: true,
        },
        fichiersStartId:
          appId === "fichiers" ? folderId ?? state.fichiersStartId : state.fichiersStartId,
      };
    }
    case "apps/CLOSE":
      return {
        ...state,
        openApps: {
          ...state.openApps,
          [action.payload]: false,
        },
      };
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
    case "prefs/PATCH":
      return {
        ...state,
        settings: {
          ...state.settings,
          prefs: {
            ...state.settings.prefs,
            ...action.payload,
          },
        },
      };
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
    case "memory/HYDRATE": {
      const { session, profile } = action.payload;
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
        dockApps: profile.dockApps?.length ? profile.dockApps : state.dockApps,
        desktopIcons: profile.desktopIcons ?? [],
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
