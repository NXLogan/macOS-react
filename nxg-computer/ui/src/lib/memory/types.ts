import {
  AccentId,
  DockIconSize,
  DockPosition,
  NotificationAppId,
  PermissionId,
  ThemeMode,
} from "../../apps/parametres/settingsMeta";

export type MemoryDockApp = {
  id: string;
  name: string;
  icon: string;
};

export type MemoryDesktopIcon = {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  kind?: "app" | "folder";
  folderId?: string;
};

export type MemoryWallpaper = {
  src: string;
  preview: string;
  name: string;
  surname: string;
  custom?: boolean;
};

export type MemoryPrefs = {
  theme: ThemeMode;
  dockPosition: DockPosition;
  dockIconSize: DockIconSize;
  accent: AccentId;
  deviceName: string;
  language: string;
  wifi: boolean;
  bluetooth: boolean;
  lockMethod: "password" | "touchid";
  autoLockMinutes: number;
  notifications: Record<NotificationAppId, boolean>;
  notificationSound: boolean;
  lockScreenPreview: boolean;
  widgets: boolean;
  permissions: Record<PermissionId, boolean>;
  cacheClearedAt?: number;
};

export type MemorySettings = {
  animations: boolean;
  color: string;
  notch: boolean;
  airdrop: boolean;
  wallpaper: MemoryWallpaper;
  prefs?: MemoryPrefs;
};

export type MemoryFsNode = {
  id: string;
  name: string;
  kind: "folder" | "file";
  parentId: string | null;
  createdAt: number;
  size?: number;
  ext?: string;
};

export type ComputerProfile = {
  version: 1;
  computerId: string;
  userId: string;
  user: {
    name: string;
    password: string;
    avatar?: string;
    phone?: string;
  };
  dockApps: MemoryDockApp[];
  desktopIcons: MemoryDesktopIcon[];
  settings: MemorySettings;
  filesystem: MemoryFsNode[];
  updatedAt: number;
};

export type MemorySession = {
  computerId: string;
  userId: string;
  userName: string;
  ready: boolean;
};

export const MEMORY_VERSION = 1 as const;
/** Must match Config.DefaultComputerId in config/config.lua */
export const DEFAULT_COMPUTER_ID = "default";
export const DEFAULT_USER_ID = "local-user";
