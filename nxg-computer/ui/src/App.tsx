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
const AppStoreApp = lazy(() => import("./apps/appstore/AppStoreApp"));
const NotesApp = lazy(() => import("./apps/notes/NotesApp"));
const PhotosApp = lazy(() => import("./apps/photos/PhotosApp"));
const WebApp = lazy(() => import("./apps/web/WebApp"));
const MusiqueApp = lazy(() => import("./apps/musique/MusiqueApp"));
const TerminalApp = lazy(() => import("./apps/terminal/TerminalApp"));
const PlansApp = lazy(() => import("./apps/plans/PlansApp"));
const CalendrierApp = lazy(() => import("./apps/calendrier/CalendrierApp"));
const MailApp = lazy(() => import("./apps/mail/MailApp"));
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
          <OpenAppsGate appId="appstore">
            <AppStoreApp />
          </OpenAppsGate>
          <OpenAppsGate appId="notes">
            <NotesApp />
          </OpenAppsGate>
          <OpenAppsGate appId="photos">
            <PhotosApp />
          </OpenAppsGate>
          <OpenAppsGate appId="web">
            <WebApp />
          </OpenAppsGate>
          <OpenAppsGate appId="musique">
            <MusiqueApp />
          </OpenAppsGate>
          <OpenAppsGate appId="terminal">
            <TerminalApp />
          </OpenAppsGate>
          <OpenAppsGate appId="plans">
            <PlansApp />
          </OpenAppsGate>
          <OpenAppsGate appId="calendrier">
            <CalendrierApp />
          </OpenAppsGate>
          <OpenAppsGate appId="mail">
            <MailApp />
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
