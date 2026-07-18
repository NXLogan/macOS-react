import storeType from "./types/store";
import { installedDockApps } from "../apps/registry";

export const defaultPrefs: storeType["settings"]["prefs"] = {
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
};

const initialState: storeType = {
  query: "",
  loading: false,
  section: "none",
  dockItem: undefined,
  dockApps: installedDockApps(),
  desktopIcons: [],
  contextMenu: {
    open: false,
    x: 0,
    y: 0,
    target: "desktop",
  },
  fichiersStartId: undefined,
  date: ["0", "0"],
  failed: false,
  booting: true,
  locked: true,
  poweredOff: false,
  soundPlayed: false,
  onTop: "wallpaper",
  windowOrder: [],
  openApps: {},
  windowChrome: {},
  notifications: [],
  session: {
    computerId: "default",
    userId: "local-user",
    userName: "NXG User",
    ready: false,
  },
  user: {
    name: "NXG User",
    password: "1234",
    avatar: undefined,
    phone: "",
  },
  settings: {
    open: false,
    animations: true,
    color: "blue",
    notch: false,
    airdrop: true,
    wallpaper: {
      open: false,
      src: "../../assets/images/catalina.jpg",
      preview: "../../assets/images/preview_catalina.jpg",
      name: "NXG Isles",
      surname: "catalina",
    },
    prefs: { ...defaultPrefs },
  },
};

export default initialState;
