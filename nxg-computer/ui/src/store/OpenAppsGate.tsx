import React, { useContext } from "react";
import { store } from "../App";

/** Mount children only while the app is open — avoids closed-app re-renders. */
export function OpenAppsGate({
  appId,
  children,
}: {
  appId: string;
  children: React.ReactNode;
}) {
  const [state] = useContext(store);
  if (!state.openApps?.[appId]) return null;
  return <>{children}</>;
}
