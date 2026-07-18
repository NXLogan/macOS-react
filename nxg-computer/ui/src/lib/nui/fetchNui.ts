/**
 * NUI bridge for FiveM (CEF).
 * In browser/dev mode, callbacks resolve with mocks.
 */

const isEnvBrowser = (): boolean => !(window as any).invokeNative;

export async function fetchNui<T = unknown>(
  eventName: string,
  data?: unknown,
  mockData?: T
): Promise<T> {
  if (isEnvBrowser()) {
    return (mockData ?? ({} as T));
  }

  const resourceName =
    (window as any).GetParentResourceName?.() ?? "nxg-computer";

  const resp = await fetch(`https://${resourceName}/${eventName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(data ?? {}),
  });

  return resp.json();
}

export function onNuiEvent<T = unknown>(
  action: string,
  handler: (data: T) => void
): () => void {
  const listener = (event: MessageEvent) => {
    const { action: eventAction, data } = event.data ?? {};
    if (eventAction === action) {
      handler(data);
    }
  };

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

export { isEnvBrowser };
