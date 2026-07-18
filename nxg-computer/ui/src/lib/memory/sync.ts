import { fetchNui, isEnvBrowser } from "../nui/fetchNui";
import {
  createDefaultProfile,
  loadLocalProfile,
  saveLocalProfile,
} from "./storage";
import { ComputerProfile } from "./types";
import storeType from "../../store/types/store";
import { defaultPrefs } from "../../store/initialState";
import { ensureCoreDockApps, sanitizeDockApps } from "../../desktop/Dock/dockApps";
import { sanitizeFs } from "../../apps/fichiers/fs";

export function profileFromState(
  state: storeType,
  computerId: string,
  userId: string
): ComputerProfile {
  return {
    version: 1,
    computerId,
    userId,
    user: {
      name: state.user.name,
      password: state.user.password,
      avatar: state.user.avatar,
      phone: state.user.phone,
    },
    dockApps: state.dockApps.map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
    })),
    desktopIcons: state.desktopIcons.map((i) => ({
      id: i.id,
      name: i.name,
      icon: i.icon,
      x: i.x,
      y: i.y,
      kind: i.kind,
      folderId: i.folderId,
    })),
    settings: {
      animations: state.settings.animations,
      color: state.settings.color,
      notch: state.settings.notch,
      airdrop: state.settings.airdrop,
      wallpaper: {
        src: state.settings.wallpaper.src,
        preview: state.settings.wallpaper.preview,
        name: state.settings.wallpaper.name,
        surname: state.settings.wallpaper.surname,
        custom: state.settings.wallpaper.custom,
      },
      prefs: state.settings.prefs,
    },
    filesystem: [],
    updatedAt: Date.now(),
  };
}

export async function loadProfile(
  computerId: string,
  userId: string,
  userName: string
): Promise<ComputerProfile> {
  if (isEnvBrowser()) {
    return loadLocalProfile(computerId, userId, userName);
  }

  try {
    const remote = await fetchNui<{ ok: boolean; profile?: ComputerProfile }>(
      "memory:load",
      { computerId, userId, userName },
      { ok: true, profile: undefined }
    );
    if (remote?.ok && remote.profile?.version === 1) {
      saveLocalProfile(remote.profile);
      return remote.profile;
    }
  } catch {
    /* fall through */
  }

  return loadLocalProfile(computerId, userId, userName);
}

export async function persistProfile(profile: ComputerProfile): Promise<void> {
  saveLocalProfile(profile);

  if (isEnvBrowser()) return;

  try {
    await fetchNui("memory:save", { profile }, { ok: true });
  } catch {
    /* local already saved */
  }
}

export function ensureProfileShape(
  partial: Partial<ComputerProfile> | null | undefined,
  computerId: string,
  userId: string,
  userName: string
): ComputerProfile {
  const base = createDefaultProfile(computerId, userId, userName);
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    version: 1,
    computerId,
    userId,
    user: {
      name: partial.user?.name || userName || base.user.name,
      password: partial.user?.password || base.user.password,
      avatar: partial.user?.avatar ?? base.user.avatar,
      phone: partial.user?.phone ?? base.user.phone,
    },
    dockApps: partial.dockApps?.length
      ? ensureCoreDockApps(
          sanitizeDockApps(partial.dockApps),
          partial.desktopIcons ?? []
        )
      : ensureCoreDockApps(base.dockApps, partial.desktopIcons ?? []),
    desktopIcons: partial.desktopIcons ?? base.desktopIcons,
    settings: {
      ...base.settings,
      ...partial.settings,
      wallpaper: {
        ...base.settings.wallpaper,
        ...partial.settings?.wallpaper,
      },
      prefs: {
        ...defaultPrefs,
        ...base.settings.prefs,
        ...partial.settings?.prefs,
        notifications: {
          ...defaultPrefs.notifications,
          ...partial.settings?.prefs?.notifications,
        },
        permissions: {
          ...defaultPrefs.permissions,
          ...partial.settings?.prefs?.permissions,
        },
      },
    },
    filesystem: partial.filesystem?.length
      ? (sanitizeFs(partial.filesystem as any) as ComputerProfile["filesystem"])
      : base.filesystem,
    updatedAt: partial.updatedAt ?? Date.now(),
  };
}
