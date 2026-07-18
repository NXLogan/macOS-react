import {
  ComputerProfile,
  DEFAULT_COMPUTER_ID,
  DEFAULT_USER_ID,
  MEMORY_VERSION,
  MemorySession,
} from "./types";
import { APP_CATALOG } from "../../desktop/Dock/dockApps";
import { installedDockApps } from "../../apps/registry";
import { buildDefaultFs } from "../../apps/fichiers/fs";

const PROFILE_PREFIX = "nxg-memory:profile:";
const SESSION_KEY = "nxg-memory:last-session";

/** Legacy keys (pre-memory) — migrated once into a profile. */
export const LEGACY_KEYS = {
  dock: "nxg-dock-order",
  desktop: "nxg-desktop-icons",
  fs: "nxg-fichiers-fs-v1",
  color: "color",
  wallpaper: "wallpaper",
} as const;

export function profileStorageKey(computerId: string, userId: string) {
  return `${PROFILE_PREFIX}${computerId}::${userId}`;
}

export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function saveLastSession(session: Pick<MemorySession, "computerId" | "userId" | "userName">) {
  writeJson(SESSION_KEY, session);
}

export function loadLastSession(): Pick<
  MemorySession,
  "computerId" | "userId" | "userName"
> | null {
  return readJson(SESSION_KEY);
}

export function createDefaultProfile(
  computerId = DEFAULT_COMPUTER_ID,
  userId = DEFAULT_USER_ID,
  userName = "NXG User"
): ComputerProfile {
  return {
    version: MEMORY_VERSION,
    computerId,
    userId,
    user: {
      name: userName,
      password: "1234",
      avatar: undefined,
      phone: "",
    },
    dockApps: installedDockApps(),
    desktopIcons: [],
    settings: {
      animations: true,
      color: "blue",
      notch: false,
      airdrop: true,
      wallpaper: {
        src: "../../assets/images/catalina.jpg",
        preview: "../../assets/images/preview_catalina.jpg",
        name: "NXG Isles",
        surname: "catalina",
        custom: false,
      },
      prefs: {
        theme: "dark",
        dockPosition: "bottom",
        dockIconSize: "medium",
        accent: "blue",
        deviceName: "NXGos",
        language: "fr",
        wifi: true,
        bluetooth: false,
        lockMethod: "password",
        autoLockMinutes: 5,
        notifications: {
          sms: true,
          mail: true,
          social: true,
          entreprise: false,
        },
        notificationSound: true,
        lockScreenPreview: true,
        widgets: false,
        permissions: {
          camera: false,
          contacts: true,
          microphone: false,
          location: false,
          files: true,
        },
      },
    },
    filesystem: buildDefaultFs(),
    updatedAt: Date.now(),
  };
}

/** Merge legacy scattered keys into a fresh profile (one-time). */
export function migrateLegacyProfile(
  computerId: string,
  userId: string,
  userName: string
): ComputerProfile | null {
  const hadAny =
    localStorage.getItem(LEGACY_KEYS.dock) ||
    localStorage.getItem(LEGACY_KEYS.desktop) ||
    localStorage.getItem(LEGACY_KEYS.fs) ||
    localStorage.getItem(LEGACY_KEYS.color) ||
    localStorage.getItem(LEGACY_KEYS.wallpaper);

  if (!hadAny) return null;

  const profile = createDefaultProfile(computerId, userId, userName);

  try {
    const dockIds = readJson<string[]>(LEGACY_KEYS.dock);
    if (dockIds?.length) {
      const map = new Map(APP_CATALOG.map((a) => [a.id, a]));
      profile.dockApps = dockIds
        .map((id) => (id === "finder" ? "fichiers" : id))
        .map((id) => map.get(id))
        .filter((a): a is (typeof APP_CATALOG)[number] => Boolean(a));
    }
  } catch {
    /* ignore */
  }

  try {
    const icons = readJson<ComputerProfile["desktopIcons"]>(LEGACY_KEYS.desktop);
    if (icons) profile.desktopIcons = icons;
  } catch {
    /* ignore */
  }

  try {
    const fs = readJson<ComputerProfile["filesystem"]>(LEGACY_KEYS.fs);
    if (fs?.length) profile.filesystem = fs;
  } catch {
    /* ignore */
  }

  try {
    const color = localStorage.getItem(LEGACY_KEYS.color);
    if (color) profile.settings.color = color;
  } catch {
    /* ignore */
  }

  try {
    const wallpaper = readJson<ComputerProfile["settings"]["wallpaper"] & { open?: boolean }>(
      LEGACY_KEYS.wallpaper
    );
    if (wallpaper) {
      profile.settings.wallpaper = {
        src: wallpaper.src,
        preview: wallpaper.preview,
        name: wallpaper.name,
        surname: wallpaper.surname,
        custom: Boolean((wallpaper as { custom?: boolean }).custom),
      };
    }
  } catch {
    /* ignore */
  }

  return profile;
}

export function loadLocalProfile(
  computerId: string,
  userId: string,
  userName: string
): ComputerProfile {
  const key = profileStorageKey(computerId, userId);
  const existing = readJson<ComputerProfile>(key);
  if (existing?.version === MEMORY_VERSION) {
    return {
      ...existing,
      computerId,
      userId,
      user: {
        ...existing.user,
        name: existing.user?.name || userName,
      },
    };
  }

  const migrated = migrateLegacyProfile(computerId, userId, userName);
  if (migrated) {
    writeJson(key, migrated);
    return migrated;
  }

  return createDefaultProfile(computerId, userId, userName);
}

export function saveLocalProfile(profile: ComputerProfile) {
  const next: ComputerProfile = {
    ...profile,
    updatedAt: Date.now(),
    version: 1,
  };
  writeJson(profileStorageKey(profile.computerId, profile.userId), next);
  saveLastSession({
    computerId: profile.computerId,
    userId: profile.userId,
    userName: profile.user.name,
  });
  return next;
}
