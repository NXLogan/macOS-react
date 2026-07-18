import { ACCENT_COLORS, AccentId } from "../../apps/parametres/settingsMeta";

/** Map legacy Control Center ids → AccentId. */
export function normalizeAccentId(color: string): AccentId {
  if (color === "babyblue") return "blue";
  if (color === "violet") return "purple";
  if (color in ACCENT_COLORS) return color as AccentId;
  return "blue";
}

const returnColor = (color: string) => {
  const id = normalizeAccentId(color);
  return ACCENT_COLORS[id];
};

export default returnColor;
