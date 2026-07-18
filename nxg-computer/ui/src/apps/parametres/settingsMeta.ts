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

export const TOTAL_STORAGE_GB = 128;
