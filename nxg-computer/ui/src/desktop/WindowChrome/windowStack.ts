/** Bring appId to the front of the stacking order (last = topmost). */
export function bumpWindowOrder(order: string[], appId: string): string[] {
  if (!appId || appId === "wallpaper" || appId === "none") return order;
  const next = order.filter((id) => id !== appId);
  next.push(appId);
  return next;
}

export function removeFromWindowOrder(order: string[], appId: string): string[] {
  return order.filter((id) => id !== appId);
}

/** CSS z-index for a window based on its place in the stack. */
export function windowStackZIndex(
  order: string[],
  appId: string,
  maximized = false
): number {
  const idx = order.indexOf(appId);
  const base = maximized ? 60 : 40;
  return base + (idx < 0 ? 0 : idx);
}
