import {
  AccentId,
  DockIconSize,
  DockPosition,
  NotificationAppId,
  PermissionId,
  ThemeMode,
} from "../../apps/parametres/settingsMeta";

interface storeType {
  query: string;
  loading: boolean;
  section: string;
  dockItem: number | undefined;
  dockApps: { id: string; name: string; icon: string }[];
  desktopIcons: {
    id: string;
    name: string;
    icon: string;
    x: number;
    y: number;
    kind?: "app" | "folder";
    folderId?: string;
  }[];
  contextMenu: {
    open: boolean;
    x: number;
    y: number;
    target: "desktop" | "icon";
    targetId?: string;
  };
  fichiersStartId?: string;
  date: any;
  failed: boolean;
  booting: boolean;
  locked: boolean;
  onTop: string;
  soundPlayed: boolean;
  openApps: Record<string, boolean>;
  windowChrome: Record<
    string,
    { minimized: boolean; maximized: boolean }
  >;
  /** Real inbox previews for lock screen — empty until a real app pushes one. */
  notifications: { id: string; title: string; body?: string; at: number }[];
  session: {
    computerId: string;
    userId: string;
    userName: string;
    ready: boolean;
  };
  user: {
    name: string;
    password: string;
    avatar?: string;
    phone?: string;
  };
  settings: {
    open: boolean;
    animations: boolean;
    color: string;
    notch: boolean;
    airdrop: boolean;
    wallpaper: {
      open: boolean;
      src: string;
      preview: string;
      name: string;
      surname: string;
      custom?: boolean;
    };
    prefs: {
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
  };
}

export default storeType;
