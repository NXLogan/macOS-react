import { ACCENT_COLORS, AccentId } from "../../apps/parametres/settingsMeta";
import { normalizeAccentId } from "./returnColor";

const updateSysColor = (color: string) => {
  const id = normalizeAccentId(color);
  const hex = ACCENT_COLORS[id as AccentId] ?? ACCENT_COLORS.blue;
  document.documentElement.style.setProperty("--user-color", hex);
  document.documentElement.style.setProperty("--nxg-accent", hex);
};

export default updateSysColor;
