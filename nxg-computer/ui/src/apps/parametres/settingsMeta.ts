export type ThemeMode = "light" | "dark" | "auto";
export type DockPosition = "bottom" | "left" | "right" | "hidden";
export type DockIconSize = "small" | "medium" | "large";
export type AccentId =
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "graphite";

export type SettingsSectionId =
  | "apparence"
  | "compte"
  | "reseau"
  | "notifications"
  | "dock"
  | "stockage"
  | "confidentialite"
  | "apropos";

export type NotificationAppId = "sms" | "mail" | "social" | "entreprise";

export type PermissionId = "camera" | "contacts" | "microphone" | "location" | "files";

export const ACCENT_COLORS: Record<AccentId, string> = {
  blue: "#0a84ff",
  purple: "#bf5af2",
  pink: "#ff375f",
  red: "#ff453a",
  orange: "#ff9f0a",
  yellow: "#ffd60a",
  green: "#30d158",
  graphite: "#8e8e93",
};

export const STORAGE_USAGE = [
  { id: "photos", label: "Photos", mb: 2300 },
  { id: "mail", label: "Mails", mb: 800 },
  { id: "fichiers", label: "Fichiers", mb: 1250 },
  { id: "music", label: "Musique", mb: 640 },
  { id: "apps", label: "Applications", mb: 3100 },
  { id: "systeme", label: "Système", mb: 4200 },
  { id: "autre", label: "Autre", mb: 380 },
] as const;

export const TOTAL_STORAGE_GB = 128;
