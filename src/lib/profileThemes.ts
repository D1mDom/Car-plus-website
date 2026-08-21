import type { TranslationKey } from "@/i18n/translations";
import wallpaperCute from "@/assets/themes/wallpaper-cute.png";
import wallpaperOcean from "@/assets/themes/wallpaper-ocean.png";
import wallpaperCandy from "@/assets/themes/wallpaper-candy.png";
import wallpaperMatcha from "@/assets/themes/wallpaper-matcha.png";
import wallpaperLavender from "@/assets/themes/wallpaper-lavender.png";
import wallpaperSunset from "@/assets/themes/wallpaper-sunset.png";
import wallpaperMidnight from "@/assets/themes/wallpaper-midnight.png";
import wallpaperClean from "@/assets/themes/wallpaper-clean.png";
import wallpaperHoney from "@/assets/themes/wallpaper-honey.png";

export type ProfileThemeId =
  | "cute"
  | "clean"
  | "ocean"
  | "sunset"
  | "matcha"
  | "lavender"
  | "honey"
  | "candy"
  | "midnight";

export const PROFILE_THEME_STORAGE = "carplus-profile-theme-v1";
export const PROFILE_COVER_MODE_STORAGE = "carplus-profile-cover-mode-v1";

export type ProfileCoverMode = "theme" | "custom";

export const PROFILE_THEME_IDS: ProfileThemeId[] = [
  "cute",
  "clean",
  "ocean",
  "sunset",
  "matcha",
  "lavender",
  "honey",
  "candy",
  "midnight",
];

export type ProfileThemeConfig = {
  id: ProfileThemeId;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  preview: string;
  iconColor: string;
  selectedRing: string;
  wallpaper?: string;
  wallpaperPosition?: string;
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
    iconColor: "text-rose-500",
    selectedRing: "border-rose-400 ring-rose-200/80",
    wallpaper: wallpaperCute,
    wallpaperPosition: "object-center",
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
    preview: "from-slate-200 via-zinc-100 to-slate-300",
    iconColor: "text-slate-600",
    selectedRing: "border-slate-400 ring-slate-200/80",
    wallpaper: wallpaperClean,
    wallpaperPosition: "object-[center_55%]",
    page: "bg-[#f4f4f5] dark:bg-background",
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
    iconColor: "text-teal-600",
    selectedRing: "border-teal-400 ring-teal-200/80",
    wallpaper: wallpaperOcean,
    wallpaperPosition: "object-[center_70%]",
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
  sunset: {
    id: "sunset",
    labelKey: "profile.theme.sunset",
    descKey: "profile.theme.sunsetDesc",
    preview: "from-amber-200 via-rose-200 to-violet-300",
    iconColor: "text-orange-500",
    selectedRing: "border-orange-400 ring-orange-200/80",
    wallpaper: wallpaperSunset,
    wallpaperPosition: "object-[center_40%]",
    page: "bg-gradient-to-br from-violet-50 via-orange-50/80 to-amber-50 dark:from-background dark:via-background dark:to-background",
    header:
      "rounded-3xl border border-white/70 bg-white/85 shadow-[0_8px_40px_-12px_rgba(249,115,22,0.28)] backdrop-blur-sm dark:border-border dark:bg-card",
    coverDefault:
      "bg-gradient-to-br from-orange-200 via-rose-200 to-amber-200 dark:from-orange-950/40 dark:via-rose-950/30 dark:to-amber-950/40",
    avatarRing: "ring-4 ring-white shadow-[0_8px_24px_-8px_rgba(249,115,22,0.45)]",
    avatarFallback: "bg-gradient-to-br from-orange-100 to-rose-100 text-orange-800",
    tabWrap: "rounded-2xl bg-white/60 p-1 dark:bg-muted/40",
    tabActive: "bg-white text-orange-600 shadow-sm dark:bg-card dark:text-orange-400",
    tabIdle: "text-muted-foreground hover:bg-white/70 hover:text-foreground",
    card: "rounded-3xl border border-white/80 bg-white/90 shadow-[0_4px_24px_-8px_rgba(251,146,60,0.28)] backdrop-blur-sm dark:border-border dark:bg-card",
    cardHeader: "border-orange-100/80 dark:border-border/60",
    badge: "bg-gradient-to-r from-orange-100 to-rose-100 text-orange-800 dark:from-orange-950/40 dark:to-rose-950/40 dark:text-orange-300",
    shortcut:
      "rounded-2xl border border-orange-100/80 bg-gradient-to-br from-white to-orange-50/50 hover:border-orange-200 hover:shadow-md dark:border-border dark:from-card dark:to-card",
    shortcutIcon: "bg-gradient-to-br from-orange-100 to-rose-100 text-orange-700",
  },
  matcha: {
    id: "matcha",
    labelKey: "profile.theme.matcha",
    descKey: "profile.theme.matchaDesc",
    preview: "from-lime-200 via-emerald-100 to-sky-100",
    iconColor: "text-emerald-600",
    selectedRing: "border-emerald-400 ring-emerald-200/80",
    wallpaper: wallpaperMatcha,
    wallpaperPosition: "object-[center_65%]",
    page: "bg-gradient-to-br from-[#E8F1F2] via-lime-50 to-emerald-50 dark:from-background dark:via-background dark:to-background",
    header:
      "rounded-3xl border border-white/70 bg-white/85 shadow-[0_8px_40px_-12px_rgba(16,185,129,0.25)] backdrop-blur-sm dark:border-border dark:bg-card",
    coverDefault:
      "bg-gradient-to-br from-lime-200 via-emerald-100 to-teal-200 dark:from-lime-950/40 dark:via-emerald-950/30 dark:to-teal-950/40",
    avatarRing: "ring-4 ring-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.4)]",
    avatarFallback: "bg-gradient-to-br from-lime-100 to-emerald-100 text-emerald-800",
    tabWrap: "rounded-2xl bg-white/60 p-1 dark:bg-muted/40",
    tabActive: "bg-white text-emerald-700 shadow-sm dark:bg-card dark:text-emerald-400",
    tabIdle: "text-muted-foreground hover:bg-white/70 hover:text-foreground",
    card: "rounded-3xl border border-white/80 bg-white/90 shadow-[0_4px_24px_-8px_rgba(52,211,153,0.22)] backdrop-blur-sm dark:border-border dark:bg-card",
    cardHeader: "border-emerald-100/80 dark:border-border/60",
    badge: "bg-gradient-to-r from-lime-100 to-emerald-100 text-emerald-800 dark:from-lime-950/40 dark:to-emerald-950/40 dark:text-emerald-300",
    shortcut:
      "rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/50 hover:border-emerald-200 hover:shadow-md dark:border-border dark:from-card dark:to-card",
    shortcutIcon: "bg-gradient-to-br from-lime-100 to-emerald-100 text-emerald-700",
  },
  lavender: {
    id: "lavender",
    labelKey: "profile.theme.lavender",
    descKey: "profile.theme.lavenderDesc",
    preview: "from-sky-200 via-blue-100 to-indigo-100",
    iconColor: "text-sky-500",
    selectedRing: "border-sky-400 ring-sky-200/80",
    wallpaper: wallpaperLavender,
    wallpaperPosition: "object-bottom",
    page: "bg-gradient-to-br from-[#E6F2FF] via-sky-50 to-indigo-50 dark:from-background dark:via-background dark:to-background",
    header:
      "rounded-3xl border border-white/70 bg-white/85 shadow-[0_8px_40px_-12px_rgba(56,189,248,0.28)] backdrop-blur-sm dark:border-border dark:bg-card",
    coverDefault:
      "bg-gradient-to-br from-sky-200 via-blue-100 to-indigo-100 dark:from-sky-950/40 dark:via-blue-950/30 dark:to-indigo-950/40",
    avatarRing: "ring-4 ring-white shadow-[0_8px_24px_-8px_rgba(56,189,248,0.45)]",
    avatarFallback: "bg-gradient-to-br from-sky-100 to-blue-100 text-sky-800",
    tabWrap: "rounded-2xl bg-white/60 p-1 dark:bg-muted/40",
    tabActive: "bg-white text-sky-600 shadow-sm dark:bg-card dark:text-sky-400",
    tabIdle: "text-muted-foreground hover:bg-white/70 hover:text-foreground",
    card: "rounded-3xl border border-white/80 bg-white/90 shadow-[0_4px_24px_-8px_rgba(125,211,252,0.28)] backdrop-blur-sm dark:border-border dark:bg-card",
    cardHeader: "border-sky-100/80 dark:border-border/60",
    badge: "bg-gradient-to-r from-sky-100 to-blue-100 text-sky-800 dark:from-sky-950/40 dark:to-blue-950/40 dark:text-sky-300",
    shortcut:
      "rounded-2xl border border-sky-100/80 bg-gradient-to-br from-white to-sky-50/50 hover:border-sky-200 hover:shadow-md dark:border-border dark:from-card dark:to-card",
    shortcutIcon: "bg-gradient-to-br from-sky-100 to-blue-100 text-sky-700",
  },
  honey: {
    id: "honey",
    labelKey: "profile.theme.honey",
    descKey: "profile.theme.honeyDesc",
    preview: "from-yellow-200 via-amber-100 to-yellow-100",
    iconColor: "text-amber-500",
    selectedRing: "border-amber-400 ring-amber-200/80",
    wallpaper: wallpaperHoney,
    wallpaperPosition: "object-center",
    page: "bg-gradient-to-br from-[#FFF9C4]/70 via-yellow-50 to-amber-50 dark:from-background dark:via-background dark:to-background",
    header:
      "rounded-3xl border border-white/70 bg-white/85 shadow-[0_8px_40px_-12px_rgba(245,158,11,0.28)] backdrop-blur-sm dark:border-border dark:bg-card",
    coverDefault:
      "bg-gradient-to-br from-amber-200 via-yellow-100 to-orange-200 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40",
    avatarRing: "ring-4 ring-white shadow-[0_8px_24px_-8px_rgba(245,158,11,0.45)]",
    avatarFallback: "bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-800",
    tabWrap: "rounded-2xl bg-white/60 p-1 dark:bg-muted/40",
    tabActive: "bg-white text-amber-700 shadow-sm dark:bg-card dark:text-amber-400",
    tabIdle: "text-muted-foreground hover:bg-white/70 hover:text-foreground",
    card: "rounded-3xl border border-white/80 bg-white/90 shadow-[0_4px_24px_-8px_rgba(252,211,77,0.35)] backdrop-blur-sm dark:border-border dark:bg-card",
    cardHeader: "border-amber-100/80 dark:border-border/60",
    badge: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 dark:from-amber-950/40 dark:to-yellow-950/40 dark:text-amber-300",
    shortcut:
      "rounded-2xl border border-amber-100/80 bg-gradient-to-br from-white to-amber-50/50 hover:border-amber-200 hover:shadow-md dark:border-border dark:from-card dark:to-card",
    shortcutIcon: "bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700",
  },
  candy: {
    id: "candy",
    labelKey: "profile.theme.candy",
    descKey: "profile.theme.candyDesc",
    preview: "from-pink-300 via-fuchsia-100 to-emerald-200",
    iconColor: "text-pink-500",
    selectedRing: "border-pink-400 ring-pink-200/80",
    wallpaper: wallpaperCandy,
    wallpaperPosition: "object-center",
    page: "bg-gradient-to-br from-pink-50 via-fuchsia-50/70 to-emerald-50 dark:from-background dark:via-background dark:to-background",
    header:
      "rounded-3xl border border-white/70 bg-white/85 shadow-[0_8px_40px_-12px_rgba(236,72,153,0.28)] backdrop-blur-sm dark:border-border dark:bg-card",
    coverDefault:
      "bg-gradient-to-br from-pink-200 via-fuchsia-100 to-emerald-200 dark:from-pink-950/40 dark:via-fuchsia-950/30 dark:to-emerald-950/40",
    avatarRing: "ring-4 ring-white shadow-[0_8px_24px_-8px_rgba(236,72,153,0.45)]",
    avatarFallback: "bg-gradient-to-br from-pink-100 to-emerald-100 text-pink-700",
    tabWrap: "rounded-2xl bg-white/60 p-1 dark:bg-muted/40",
    tabActive: "bg-white text-pink-600 shadow-sm dark:bg-card dark:text-pink-400",
    tabIdle: "text-muted-foreground hover:bg-white/70 hover:text-foreground",
    card: "rounded-3xl border border-white/80 bg-white/90 shadow-[0_4px_24px_-8px_rgba(244,114,182,0.28)] backdrop-blur-sm dark:border-border dark:bg-card",
    cardHeader: "border-pink-100/80 dark:border-border/60",
    badge: "bg-gradient-to-r from-pink-100 to-emerald-100 text-pink-700 dark:from-pink-950/40 dark:to-emerald-950/40 dark:text-pink-300",
    shortcut:
      "rounded-2xl border border-pink-100/80 bg-gradient-to-br from-white to-pink-50/50 hover:border-pink-200 hover:shadow-md dark:border-border dark:from-card dark:to-card",
    shortcutIcon: "bg-gradient-to-br from-pink-100 to-emerald-100 text-pink-600",
  },
  midnight: {
    id: "midnight",
    labelKey: "profile.theme.midnight",
    descKey: "profile.theme.midnightDesc",
    preview: "from-slate-800 via-indigo-800 to-blue-900",
    iconColor: "text-indigo-600",
    selectedRing: "border-indigo-400 ring-indigo-200/80",
    wallpaper: wallpaperMidnight,
    wallpaperPosition: "object-[center_45%]",
    page: "bg-gradient-to-br from-slate-100 via-indigo-50/80 to-slate-50 dark:from-background dark:via-background dark:to-background",
    header:
      "rounded-3xl border border-white/70 bg-white/85 shadow-[0_8px_40px_-12px_rgba(79,70,229,0.28)] backdrop-blur-sm dark:border-border dark:bg-card",
    coverDefault:
      "bg-gradient-to-br from-indigo-300 via-slate-200 to-violet-300 dark:from-indigo-950/50 dark:via-slate-950/40 dark:to-violet-950/40",
    avatarRing: "ring-4 ring-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.45)]",
    avatarFallback: "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-800",
    tabWrap: "rounded-2xl bg-white/60 p-1 dark:bg-muted/40",
    tabActive: "bg-white text-indigo-700 shadow-sm dark:bg-card dark:text-indigo-400",
    tabIdle: "text-muted-foreground hover:bg-white/70 hover:text-foreground",
    card: "rounded-3xl border border-white/80 bg-white/90 shadow-[0_4px_24px_-8px_rgba(129,140,248,0.28)] backdrop-blur-sm dark:border-border dark:bg-card",
    cardHeader: "border-indigo-100/80 dark:border-border/60",
    badge: "bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-800 dark:from-indigo-950/40 dark:to-violet-950/40 dark:text-indigo-300",
    shortcut:
      "rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white to-indigo-50/50 hover:border-indigo-200 hover:shadow-md dark:border-border dark:from-card dark:to-card",
    shortcutIcon: "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700",
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

export const readCoverMode = (): ProfileCoverMode => {
  try {
    const raw = localStorage.getItem(PROFILE_COVER_MODE_STORAGE);
    if (raw === "theme" || raw === "custom") return raw;
  } catch {
    /* ignore */
  }
  return "theme";
};
