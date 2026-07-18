import { useContext, useEffect, useRef } from "react";
import { store } from "../../App";
import { loadFs, saveFs, sanitizeFs, setFsScope } from "../../apps/fichiers/fs";
import {
  applyWallpaperToPage,
  resolveBundledWallpaper,
} from "../../utils/helpers/applyWallpaper";
import updateSysColor from "../../utils/helpers/updateSysColor";
import {
  ComputerProfile,
  DEFAULT_COMPUTER_ID,
  DEFAULT_USER_ID,
} from "./types";
import { loadLastSession } from "./storage";
import {
  ensureProfileShape,
  loadProfile,
  persistProfile,
  profileFromState,
} from "./sync";
import { onNuiEvent } from "../nui/fetchNui";

const SAVE_DEBOUNCE_MS = 450;

function applyVisuals(profile: {
  settings: {
    color: string;
    wallpaper: {
      custom?: boolean;
      src: string;
      surname: string;
    };
  };
}) {
  updateSysColor(profile.settings.color);
  try {
    if (profile.settings.wallpaper.custom && profile.settings.wallpaper.src) {
      applyWallpaperToPage(profile.settings.wallpaper.src);
    } else if (profile.settings.wallpaper.surname) {
      applyWallpaperToPage(
        resolveBundledWallpaper(profile.settings.wallpaper.surname)
      );
    }
  } catch {
    /* ignore */
  }
}

export default function MemoryBootstrap() {
  const [state, dispatch] = useContext(store);
  const hydrated = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const skipNextSave = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const applyProfile = (
    computerId: string,
    userId: string,
    userName: string,
    profile: ComputerProfile
  ) => {
    skipNextSave.current = true;
    const shaped = ensureProfileShape(profile, computerId, userId, userName);
    setFsScope(computerId, userId);
    if (shaped.filesystem?.length) {
      saveFs(sanitizeFs(shaped.filesystem as any));
    } else {
      saveFs(loadFs());
    }

    dispatch({
      type: "memory/HYDRATE",
      payload: {
        session: {
          computerId,
          userId,
          userName: shaped.user.name || userName,
          ready: true,
        },
        profile: shaped,
      },
    });

    applyVisuals(shaped);
    window.dispatchEvent(new Event("nxg-fs-changed"));
    window.dispatchEvent(new Event("nxg-memory-hydrated"));
    hydrated.current = true;
    window.setTimeout(() => {
      skipNextSave.current = false;
    }, 120);
  };

  const hydrate = async (
    computerId: string,
    userId: string,
    userName: string
  ) => {
    const profile = await loadProfile(computerId, userId, userName);
    applyProfile(computerId, userId, userName, profile);
  };

  const scheduleSave = () => {
    if (!hydrated.current || skipNextSave.current) return;
    const s = stateRef.current;
    if (!s.session?.ready) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const current = stateRef.current;
      if (!current.session?.ready || skipNextSave.current) return;
      const profile = {
        ...profileFromState(
          current,
          current.session.computerId,
          current.session.userId
        ),
        filesystem: loadFs(),
      };
      void persistProfile(profile);
    }, SAVE_DEBOUNCE_MS);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const last = loadLastSession();
    const computerId =
      params.get("pc") ||
      params.get("computer") ||
      last?.computerId ||
      DEFAULT_COMPUTER_ID;
    const userId = params.get("user") || last?.userId || DEFAULT_USER_ID;
    const userName = params.get("name") || last?.userName || "NXG User";

    void hydrate(computerId, userId, userName);

    const offOpen = onNuiEvent<{
      computerId?: string;
      userId?: string;
      userName?: string;
    }>("computer:open", (data) => {
      void hydrate(
        data?.computerId || DEFAULT_COMPUTER_ID,
        data?.userId || userId || DEFAULT_USER_ID,
        data?.userName || userName
      );
    });

    const offSession = onNuiEvent<{
      computerId: string;
      userId: string;
      userName?: string;
    }>("memory:session", (data) => {
      if (!data?.computerId || !data?.userId) return;
      // If we only got identity (no profile yet), load local cache for that PC+user
      void hydrate(
        data.computerId,
        data.userId,
        data.userName || "NXG User"
      );
    });

    const offProfile = onNuiEvent<{
      computerId: string;
      userId: string;
      userName?: string;
      profile: ComputerProfile;
    }>("memory:profile", (data) => {
      if (!data?.computerId || !data?.userId || !data.profile) return;
      applyProfile(
        data.computerId,
        data.userId,
        data.userName || "NXG User",
        data.profile
      );
    });

    return () => {
      offOpen();
      offSession();
      offProfile();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scheduleSave();
  }, [
    state.session?.ready,
    state.session?.computerId,
    state.session?.userId,
    state.dockApps,
    state.desktopIcons,
    state.user,
    state.settings.animations,
    state.settings.color,
    state.settings.notch,
    state.settings.airdrop,
    state.settings.wallpaper.src,
    state.settings.wallpaper.name,
    state.settings.wallpaper.surname,
    state.settings.wallpaper.custom,
    state.settings.wallpaper.preview,
    state.settings.prefs,
    state.user.avatar,
    state.user.phone,
  ]);

  useEffect(() => {
    const onDirty = () => scheduleSave();
    window.addEventListener("nxg-memory-dirty", onDirty);
    window.addEventListener("nxg-fs-changed", onDirty);
    return () => {
      window.removeEventListener("nxg-memory-dirty", onDirty);
      window.removeEventListener("nxg-fs-changed", onDirty);
    };
  }, []);

  return null;
}
