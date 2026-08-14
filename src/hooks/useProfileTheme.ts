import { useCallback, useEffect, useState } from "react";
import {
  PROFILE_THEME_STORAGE,
  PROFILE_THEMES,
  readProfileTheme,
  type ProfileThemeId,
} from "@/lib/profileThemes";

export const useProfileTheme = () => {
  const [themeId, setThemeId] = useState<ProfileThemeId>(() => readProfileTheme());

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_THEME_STORAGE, themeId);
    } catch {
      /* ignore */
    }
  }, [themeId]);

  const setTheme = useCallback((id: ProfileThemeId) => {
    setThemeId(id);
  }, []);

  return {
    themeId,
    theme: PROFILE_THEMES[themeId],
    setTheme,
  };
};
