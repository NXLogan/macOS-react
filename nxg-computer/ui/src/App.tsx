import "./App.scss";
import React, { createContext, useReducer } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { LayoutGroup } from "framer-motion";
import reducer from "./store/reducer";
import initialState from "./store/initialState";
import Desktop from "./desktop/Desktop/Desktop";
import MenuBar from "./desktop/MenuBar/MenuBar";
import Dock from "./desktop/Dock/Dock";
import ContextMenu from "./desktop/ContextMenu/ContextMenu";
import WallpaperWindow from "./desktop/WallpaperWindow/WallpaperWindow";
import FichiersApp from "./apps/fichiers/FichiersApp";
import ParametresApp from "./apps/parametres/ParametresApp";
import PrefsEffects from "./apps/parametres/PrefsEffects";
import DesktopIcons from "./desktop/DesktopIcons/DesktopIcons";
import MemoryBootstrap from "./lib/memory/MemoryBootstrap";
import DesktopWidgets from "./desktop/DesktopWidgets/DesktopWidgets";

export const store = createContext<any>(null);

const StoreProvider = ({ children }: any) => (
  <store.Provider value={useReducer(reducer, initialState)}>
    {children}
  </store.Provider>
);

function App() {
  return (
    <ChakraProvider>
      <StoreProvider>
        <MemoryBootstrap />
        <PrefsEffects />
        <LayoutGroup id="nxg-dock-desktop">
          <Desktop>
            <MenuBar />
            <DesktopIcons />
            <DesktopWidgets />
            <FichiersApp />
            <ParametresApp />
            <WallpaperWindow />
            <ContextMenu />
            <Dock />
          </Desktop>
        </LayoutGroup>
      </StoreProvider>
    </ChakraProvider>
  );
}

export default App;
