import type { TranslationKey } from "@/i18n/translations";

export type ProfileThemeId = "cute" | "clean" | "ocean";

export const PROFILE_THEME_STORAGE = "carplus-profile-theme-v1";

export const PROFILE_THEME_IDS: ProfileThemeId[] = ["cute", "clean", "ocean"];

export type ProfileThemeConfig = {
  id: ProfileThemeId;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  preview: string;
  page: string;
  header: string;
  coverDefault: string;
  avatarRing: string;
  avatarFallback: string;
  tabWrap: string;
  tabActive: string;
  tabIdle: string;
  card: string;
  cardHeader: string;
  badge: string;
  shortcut: string;
  shortcutIcon: string;
};

export const PROFILE_THEMES: Record<ProfileThemeId, ProfileThemeConfig> = {
  cute: {
    id: "cute",
    labelKey: "profile.theme.cute",
    descKey: "profile.theme.cuteDesc",
    preview: "from-rose-200 via-violet-100 to-sky-200",
    page: "bg-gradient-to-br from-rose-50 via-violet-50/80 to-sky-50 dark:from-background dark:via-background dark:to-background",
    header:
      "rounded-3xl border border-white/70 bg-white/85 shadow-[0_8px_40px_-12px_rgba(236,72,153,0.25)] backdrop-blur-sm dark:border-border dark:bg-card",
    coverDefault:
      "bg-gradient-to-br from-rose-200 via-fuchsia-100 to-sky-200 dark:from-rose-950/40 dark:via-fuchsia-950/30 dark:to-sky-950/40",
    avatarRing: "ring-4 ring-white shadow-[0_8px_24px_-8px_rgba(236,72,153,0.45)]",
    avatarFallback: "bg-gradient-to-br from-rose-100 to-sky-100 text-[#174080]",
    tabWrap: "rounded-2xl bg-white/60 p-1 dark:bg-muted/40",
    tabActive: "bg-white text-rose-600 shadow-sm dark:bg-card dark:text-rose-400",
    tabIdle: "text-muted-foreground hover:bg-white/70 hover:text-foreground",
    card: "rounded-3xl border border-white/80 bg-white/90 shadow-[0_4px_24px_-8px_rgba(148,163,184,0.35)] backdrop-blur-sm dark:border-border dark:bg-card",
    cardHeader: "border-rose-100/80 dark:border-border/60",
    badge: "bg-gradient-to-r from-rose-100 to-sky-100 text-rose-700 dark:from-rose-950/40 dark:to-sky-950/40 dark:text-rose-300",
    shortcut:
      "rounded-2xl border border-rose-100/80 bg-gradient-to-br from-white to-rose-50/50 hover:border-rose-200 hover:shadow-md dark:border-border dark:from-card dark:to-card",
    shortcutIcon: "bg-gradient-to-br from-rose-100 to-sky-100 text-[#174080]",
  },
  clean: {
    id: "clean",
    labelKey: "profile.theme.clean",
    descKey: "profile.theme.cleanDesc",
    preview: "from-slate-100 to-slate-200",
    page: "bg-[#f0f2f5] dark:bg-background",
    header: "rounded-none border-0 bg-card shadow-sm sm:rounded-2xl sm:border sm:border-border/70",
    coverDefault: "bg-[#dfe0e4] dark:bg-muted",
    avatarRing: "ring-4 ring-card shadow-md",
    avatarFallback: "bg-muted text-[#174080]",
    tabWrap: "border-t border-border/80 bg-transparent p-0",
    tabActive:
      "text-[#174080] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#174080]",
    tabIdle: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
    card: "rounded-2xl border border-border/70 bg-card shadow-sm",
    cardHeader: "border-border/60",
    badge: "bg-[#174080]/10 text-[#174080]",
    shortcut: "rounded-xl border border-border/70 bg-muted/30 hover:border-primary/30 hover:bg-primary/5",
    shortcutIcon: "bg-primary/10 text-primary",
  },
  ocean: {
    id: "ocean",
    labelKey: "profile.theme.ocean",
    descKey: "profile.theme.oceanDesc",
    preview: "from-cyan-200 via-teal-100 to-blue-200",
    page: "bg-gradient-to-br from-cyan-50 via-teal-50/70 to-blue-50 dark:from-background dark:via-background dark:to-background",
    header:
      "rounded-3xl border border-white/70 bg-white/85 shadow-[0_8px_40px_-12px_rgba(20,184,166,0.25)] backdrop-blur-sm dark:border-border dark:bg-card",
    coverDefault:
      "bg-gradient-to-br from-cyan-200 via-teal-100 to-blue-200 dark:from-cyan-950/40 dark:via-teal-950/30 dark:to-blue-950/40",
    avatarRing: "ring-4 ring-white shadow-[0_8px_24px_-8px_rgba(20,184,166,0.4)]",
    avatarFallback: "bg-gradient-to-br from-cyan-100 to-blue-100 text-teal-800",
    tabWrap: "rounded-2xl bg-white/60 p-1 dark:bg-muted/40",
    tabActive: "bg-white text-teal-700 shadow-sm dark:bg-card dark:text-teal-400",
    tabIdle: "text-muted-foreground hover:bg-white/70 hover:text-foreground",
    card: "rounded-3xl border border-white/80 bg-white/90 shadow-[0_4px_24px_-8px_rgba(45,212,191,0.2)] backdrop-blur-sm dark:border-border dark:bg-card",
    cardHeader: "border-teal-100/80 dark:border-border/60",
    badge: "bg-gradient-to-r from-cyan-100 to-teal-100 text-teal-800 dark:from-cyan-950/40 dark:to-teal-950/40 dark:text-teal-300",
    shortcut:
      "rounded-2xl border border-teal-100/80 bg-gradient-to-br from-white to-cyan-50/50 hover:border-teal-200 hover:shadow-md dark:border-border dark:from-card dark:to-card",
    shortcutIcon: "bg-gradient-to-br from-cyan-100 to-teal-100 text-teal-700",
  },
};

export const readProfileTheme = (): ProfileThemeId => {
  try {
    const raw = localStorage.getItem(PROFILE_THEME_STORAGE);
    if (raw && PROFILE_THEME_IDS.includes(raw as ProfileThemeId)) {
      return raw as ProfileThemeId;
    }
  } catch {
    /* ignore */
  }
  return "cute";
};
