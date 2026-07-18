import storeType from "./types/store";
import { APP_CATALOG } from "../desktop/Dock/dockApps";

export const defaultPrefs: storeType["settings"]["prefs"] = {
  theme: "dark",
  dockPosition: "bottom",
  dockIconSize: "medium",
  accent: "blue",
  deviceName: "NXG Computer",
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
  dockApps: APP_CATALOG,
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
  soundPlayed: false,
  onTop: "wallpaper",
  openApps: {},
  session: {
    computerId: "local-pc",
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
      name: "Catalina",
      surname: "catalina",
    },
    prefs: { ...defaultPrefs },
  },
};

export default initialState;
