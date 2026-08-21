import { useCallback, useState } from "react";
import {
  PROFILE_COVER_MODE_STORAGE,
  PROFILE_THEME_STORAGE,
  PROFILE_THEMES,
  readCoverMode,
  readProfileTheme,
  type ProfileCoverMode,
  type ProfileThemeId,
} from "@/lib/profileThemes";

const writeLocal = (themeId: ProfileThemeId, coverMode: ProfileCoverMode) => {
  try {
    localStorage.setItem(PROFILE_THEME_STORAGE, themeId);
    localStorage.setItem(PROFILE_COVER_MODE_STORAGE, coverMode);
  } catch {
    /* ignore */
  }
};

export const useProfileTheme = () => {
  const [savedId, setSavedId] = useState<ProfileThemeId>(() => readProfileTheme());
  const [themeId, setThemeId] = useState<ProfileThemeId>(savedId);
  const [savedCoverMode, setSavedCoverMode] = useState<ProfileCoverMode>(() => readCoverMode());
  const [coverMode, setCoverMode] = useState<ProfileCoverMode>(savedCoverMode);

  const setTheme = useCallback((id: ProfileThemeId) => {
    setThemeId(id);
    setCoverMode("theme");
  }, []);

  const setCustomCover = useCallback(() => {
    setCoverMode("custom");
  }, []);

  const saveTheme = useCallback(
    (id: ProfileThemeId = themeId, mode: ProfileCoverMode = coverMode) => {
      setSavedId(id);
      setThemeId(id);
      setSavedCoverMode(mode);
      setCoverMode(mode);
      writeLocal(id, mode);
    },
    [coverMode, themeId],
  );

  const hydrateTheme = useCallback((id: ProfileThemeId, mode?: ProfileCoverMode) => {
    const nextMode = mode ?? readCoverMode();
    setSavedId(id);
    setThemeId(id);
    setSavedCoverMode(nextMode);
    setCoverMode(nextMode);
    writeLocal(id, nextMode);
  }, []);

  return {
    themeId,
    theme: PROFILE_THEMES[themeId] ?? PROFILE_THEMES.cute,
    coverMode,
    isDirty: themeId !== savedId || coverMode !== savedCoverMode,
    setTheme,
    setCustomCover,
    saveTheme,
    hydrateTheme,
  };
};
