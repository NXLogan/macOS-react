import "./App.scss";
import React, { createContext, lazy, Suspense, useReducer } from "react";
import reducer from "./store/reducer";
import initialState from "./store/initialState";
import Desktop from "./desktop/Desktop/Desktop";
import MenuBar from "./desktop/MenuBar/MenuBar";
import Dock from "./desktop/Dock/Dock";
import ContextMenu from "./desktop/ContextMenu/ContextMenu";
import PrefsEffects from "./apps/parametres/PrefsEffects";
import DesktopIcons from "./desktop/DesktopIcons/DesktopIcons";
import MemoryBootstrap from "./lib/memory/MemoryBootstrap";
import NuiLifecycle from "./lib/nui/NuiLifecycle";
import DesktopWidgets from "./desktop/DesktopWidgets/DesktopWidgets";
import { OpenAppsGate } from "./store/OpenAppsGate";

export const store = createContext<any>(null);

const StoreProvider = ({ children }: any) => (
  <store.Provider value={useReducer(reducer, initialState)}>
    {children}
  </store.Provider>
);

const FichiersApp = lazy(() => import("./apps/fichiers/FichiersApp"));
const ParametresApp = lazy(() => import("./apps/parametres/ParametresApp"));
const CalculatorApp = lazy(() => import("./apps/calculator/CalculatorApp"));
const CorbeilleApp = lazy(() => import("./apps/corbeille/CorbeilleApp"));
const WallpaperWindow = lazy(
  () => import("./desktop/WallpaperWindow/WallpaperWindow")
);

function App() {
  return (
    <StoreProvider>
      <NuiLifecycle />
      <MemoryBootstrap />
      <PrefsEffects />
      <Desktop>
        <MenuBar />
        <DesktopIcons />
        <DesktopWidgets />
        <Suspense fallback={null}>
          <OpenAppsGate appId="fichiers">
            <FichiersApp />
          </OpenAppsGate>
          <OpenAppsGate appId="parametres">
            <ParametresApp />
          </OpenAppsGate>
          <OpenAppsGate appId="calculator">
            <CalculatorApp />
          </OpenAppsGate>
          <OpenAppsGate appId="corbeille">
            <CorbeilleApp />
          </OpenAppsGate>
          <WallpaperWindow />
        </Suspense>
        <ContextMenu />
        <Dock />
      </Desktop>
    </StoreProvider>
  );
}

export default App;
