import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfilePersonalForm from "@/components/ProfilePersonalForm";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, type Profile } from "@/hooks/useProfile";
import { useProfileTheme } from "@/hooks/useProfileTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { PROFILE_THEME_IDS, PROFILE_THEMES } from "@/lib/profileThemes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { onImgError } from "@/lib/imageFallback";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Send,
  Shield,
  Globe,
  Package,
  Heart,
  Car,
  MessageCircle,
  LogOut,
  CheckCircle2,
  ChevronRight,
  Clock3,
  KeyRound,
  Camera,
  Trash2,
  Sparkles,
  Palette,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

type SectionId =
  | "personal"
  | "contact"
  | "security"
  | "preferences"
  | "shortcuts"
  | "account";

const NAV: { id: SectionId; icon: typeof User; label: TranslationKey }[] = [
  { id: "personal", icon: User, label: "profile.nav.personal" },
  { id: "contact", icon: Send, label: "profile.nav.contact" },
  { id: "security", icon: Shield, label: "profile.nav.security" },
  { id: "preferences", icon: Globe, label: "profile.nav.preferences" },
  { id: "shortcuts", icon: Package, label: "profile.nav.shortcuts" },
  { id: "account", icon: LogOut, label: "profile.nav.account" },
];

const SHORTCUTS: {
  to: string;
  icon: typeof Package;
  title: TranslationKey;
  desc: TranslationKey;
}[] = [
  { to: "/orders", icon: Package, title: "profile.shortcut.orders", desc: "profile.shortcut.ordersDesc" },
  { to: "/wishlist", icon: Heart, title: "profile.shortcut.wishlist", desc: "profile.shortcut.wishlistDesc" },
  { to: "/cars", icon: Car, title: "profile.shortcut.cars", desc: "profile.shortcut.carsDesc" },
  { to: "/contact", icon: MessageCircle, title: "profile.shortcut.contact", desc: "profile.shortcut.contactDesc" },
];

const Profile = () => {
  const { user, loading: authLoading, signOut, updatePassword } = useAuth();
  const { data: profile, isLoading, save, uploadAvatarFile, uploadCoverFile } = useProfile();
  const { themeId, theme, setTheme } = useProfileTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<SectionId>("personal");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [telegram, setTelegram] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutSuccessOpen, setLogoutSuccessOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const contactReady = useRef(false);

  // Hero name comes from saved profile only (not live typing)
  const displayName =
    profile?.full_name?.trim() ||
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    user?.email?.split("@")[0] ||
    "User";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    contactReady.current = false;
    setAvatarUrl("");
    setCoverUrl("");
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || isLoading || contactReady.current) return;
    const meta = user.user_metadata ?? {};
    setAvatarUrl(
      profile?.avatar_url ||
        (typeof meta.avatar_url === "string" ? meta.avatar_url : "") ||
        ""
    );
    setCoverUrl(
      profile?.cover_url ||
        (typeof meta.cover_url === "string" ? meta.cover_url : "") ||
        ""
    );
    setTelegram(
      profile?.telegram ||
        (typeof meta.telegram === "string" ? meta.telegram : "") ||
        ""
    );
    setPreferredTime(
      profile?.preferred_time ||
        (typeof meta.preferred_time === "string" ? meta.preferred_time : "") ||
        ""
    );
    contactReady.current = true;
  }, [user?.id, user?.user_metadata, isLoading, profile]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const onPersonalSaved = (saved: Profile) => {
    setAvatarUrl(saved.avatar_url ?? avatarUrl);
    setCoverUrl(saved.cover_url ?? coverUrl);
    setTelegram(saved.telegram ?? telegram);
    setPreferredTime(saved.preferred_time ?? preferredTime);
  };

  const profileSaveBase = () => ({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
    avatar_url: avatarUrl || null,
    cover_url: coverUrl || null,
    telegram: profile?.telegram ?? telegram,
    preferred_time: profile?.preferred_time ?? preferredTime,
  });

  const onSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await save.mutateAsync({
        ...profileSaveBase(),
        telegram,
        preferred_time: preferredTime,
      });
      setTelegram(saved.telegram ?? "");
      setPreferredTime(saved.preferred_time ?? "");
      toast.success(t("profile.contactSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.saveFail"));
    }
  };

  const onPickAvatar = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.avatarInvalid"));
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAvatarFile.mutateAsync(file);
      setAvatarUrl(url);
      await save.mutateAsync({
        ...profileSaveBase(),
        avatar_url: url,
      });
      toast.success(t("profile.avatarSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.avatarFail"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onRemoveAvatar = async () => {
    setUploading(true);
    try {
      setAvatarUrl("");
      await save.mutateAsync({
        ...profileSaveBase(),
        avatar_url: null,
      });
      toast.success(t("profile.avatarRemoved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.saveFail"));
    } finally {
      setUploading(false);
    }
  };

  const onPickCover = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.avatarInvalid"));
      return;
    }
    setUploadingCover(true);
    try {
      const url = await uploadCoverFile.mutateAsync(file);
      setCoverUrl(url);
      await save.mutateAsync({
        ...profileSaveBase(),
        cover_url: url,
      });
      toast.success(t("profile.coverSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.coverFail"));
    } finally {
      setUploadingCover(false);
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  };

  const onRemoveCover = async () => {
    setUploadingCover(true);
    try {
      setCoverUrl("");
      await save.mutateAsync({
        ...profileSaveBase(),
        cover_url: null,
      });
      toast.success(t("profile.coverRemoved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.saveFail"));
    } finally {
      setUploadingCover(false);
    }
  };

  const onSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t("profile.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }
    setSavingPassword(true);
    const { error } = await updatePassword(newPassword);
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success(t("profile.passwordSaved"));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    setLogoutConfirmOpen(false);
    setLogoutSuccessOpen(true);
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className={cn("min-h-screen transition-colors duration-300", theme.page)}>
      <Header />
      <main className="pb-16 pt-[72px] sm:pt-[80px]">
        <div className={cn("mx-auto w-full max-w-[940px] overflow-hidden", theme.header)}>
          {/* Cover photo */}
          <div
            className={cn(
              "group relative h-[200px] overflow-hidden sm:h-[260px] md:h-[320px]",
              !coverUrl && theme.coverDefault,
            )}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                onError={onImgError}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="pointer-events-none absolute inset-0 opacity-40">
                <div className="absolute -left-8 top-8 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
                <div className="absolute bottom-4 right-10 h-24 w-24 rounded-full bg-white/25 blur-xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/25" />
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
              <button
                type="button"
                disabled={uploadingCover}
                onClick={() => coverFileRef.current?.click()}
                className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-md transition hover:bg-white/95 disabled:opacity-60 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                {uploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {t("profile.editCover")}
              </button>
              {coverUrl ? (
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => void onRemoveCover()}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-foreground shadow-md transition hover:bg-white/95 disabled:opacity-60 dark:bg-zinc-800 dark:text-white"
                  aria-label={t("profile.coverRemove")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPickCover(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Avatar + name row */}
          <div className="relative px-4 pb-3 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="group/avatar relative -mt-[56px] shrink-0 sm:-mt-[72px]">
                  <div
                    className={cn(
                      "flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full text-4xl font-bold sm:h-[144px] sm:w-[144px]",
                      theme.avatarRing,
                      !avatarUrl && theme.avatarFallback,
                    )}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        onError={onImgError}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#e4e6eb] text-foreground shadow-sm transition hover:bg-[#d8dadf] disabled:opacity-60 dark:bg-zinc-700 dark:hover:bg-zinc-600 sm:bottom-3 sm:right-3 sm:h-10 sm:w-10"
                    aria-label={t("profile.editPhoto")}
                    title={t("profile.editPhoto")}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void onPickAvatar(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="min-w-0 pb-1 sm:pb-2">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                        theme.badge,
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("profile.welcomeBadge")}
                    </span>
                  </div>
                  <h1 className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-[32px]">
                    {displayName}
                  </h1>
                  {memberSince && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("profile.memberSince")}: {memberSince}
                    </p>
                  )}
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hidden shrink-0 border-border/80 bg-muted/40 sm:inline-flex"
                  disabled={uploading}
                  onClick={() => void onRemoveAvatar()}
                >
                  {t("profile.avatarRemove")}
                </Button>
              ) : null}
            </div>
          </div>

          {/* Profile tabs */}
          <nav className={cn("mx-3 mb-3 mt-1 flex gap-1 overflow-x-auto sm:mx-4", theme.tabWrap)}>
            {NAV.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all sm:px-4",
                  section === id ? theme.tabActive : theme.tabIdle,
                )}
              >
                <Icon className="h-4 w-4" />
                {t(label)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="mx-auto w-full max-w-[940px] px-[10px] py-4 sm:px-4">
          <div className="min-w-0 space-y-4">
            {isLoading && (section === "personal" || section === "contact") ? (
              <div className={cn("flex justify-center py-16", theme.card)}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : null}

            {section === "personal" && !isLoading && (
              <div className={cn("p-5 sm:p-6", theme.card)}>
                <div className={cn("mb-5 border-b pb-4", theme.cardHeader)}>
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    {t("profile.details")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("profile.detailsDesc")}</p>
                </div>

                <ProfilePersonalForm
                  email={user.email ?? ""}
                  profile={profile}
                  avatarUrl={avatarUrl}
                  onSaved={onPersonalSaved}
                />
              </div>
            )}

              {section === "contact" && !isLoading && (
                <div className={cn("p-5 sm:p-6", theme.card)}>
                  <div className={cn("mb-5 border-b pb-4", theme.cardHeader)}>
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      {t("profile.contactTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("profile.contactDesc")}</p>
                  </div>
                  <form onSubmit={onSaveContact} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="telegram" className="flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("profile.telegram")}
                      </Label>
                      <Input
                        id="telegram"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        placeholder={t("profile.telegramPlaceholder")}
                      />
                      <p className="text-xs text-muted-foreground">{t("profile.telegramHint")}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("profile.preferredTime")}
                      </Label>
                      <Select
                        value={preferredTime || "any"}
                        onValueChange={(v) => setPreferredTime(v === "any" ? "" : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("profile.preferredTimePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">{t("profile.time.any")}</SelectItem>
                          <SelectItem value="morning">{t("profile.time.morning")}</SelectItem>
                          <SelectItem value="afternoon">{t("profile.time.afternoon")}</SelectItem>
                          <SelectItem value="evening">{t("profile.time.evening")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                      {t("profile.contactAlsoUses")}
                    </div>
                    <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
                      {save.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("profile.saving")}
                        </>
                      ) : (
                        t("profile.saveContact")
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {section === "security" && (
                <div className={cn("p-5 sm:p-6", theme.card)}>
                  <div className={cn("mb-5 border-b pb-4", theme.cardHeader)}>
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      {t("profile.securityTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("profile.securityDesc")}</p>
                  </div>
                  <form onSubmit={onSavePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("profile.newPassword")}
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>
                    <Button type="submit" disabled={savingPassword} className="w-full sm:w-auto">
                      {savingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("profile.saving")}
                        </>
                      ) : (
                        t("profile.changePassword")
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {section === "preferences" && (
                <div className={cn("space-y-5 p-5 sm:p-6", theme.card)}>
                  <div className={cn("border-b pb-4", theme.cardHeader)}>
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      {t("profile.preferencesTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("profile.preferencesDesc")}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{t("profile.theme.title")}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {PROFILE_THEME_IDS.map((id) => {
                        const item = PROFILE_THEMES[id];
                        const selected = themeId === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setTheme(id)}
                            className={cn(
                              "overflow-hidden rounded-2xl border-2 text-left transition-all",
                              selected
                                ? "border-[#174080] shadow-md ring-2 ring-[#174080]/20"
                                : "border-border/70 hover:border-[#174080]/40 hover:shadow-sm",
                            )}
                          >
                            <div className={cn("h-16 bg-gradient-to-br", item.preview)} />
                            <div className="p-3">
                              <p className="text-sm font-semibold text-foreground">{t(item.labelKey)}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{t(item.descKey)}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("profile.language")}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t("profile.languageHint")}</p>
                    </div>
                    <LanguageSwitcher />
                  </div>
                </div>
              )}

              {section === "shortcuts" && (
                <div className={cn("p-5 sm:p-6", theme.card)}>
                  <div className={cn("mb-5 border-b pb-4", theme.cardHeader)}>
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      {t("profile.shortcutsTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("profile.shortcutsDesc")}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SHORTCUTS.map(({ to, icon: Icon, title, desc }) => (
                      <Link
                        key={to}
                        to={to}
                        className={cn(
                          "group flex items-start gap-3 p-4 transition-all",
                          theme.shortcut,
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            theme.shortcutIcon,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary">
                              {t(title)}
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{t(desc)}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {section === "account" && (
                <div className={cn("p-5 sm:p-6", theme.card)}>
                  <div className={cn("mb-5 border-b pb-4", theme.cardHeader)}>
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      {t("profile.accountTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("profile.accountDesc")}</p>
                  </div>
                  <div className="mb-4 space-y-2 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{t("profile.email")}</span>
                      <span className="truncate font-medium text-foreground">{user.email}</span>
                    </div>
                    {memberSince && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">{t("profile.memberSince")}</span>
                        <span className="font-medium text-foreground">{memberSince}</span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
                    <p className="text-sm font-medium text-foreground">{t("profile.logoutLabel")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("auth.logoutDesc")}</p>
                    <Button
                      type="button"
                      variant="destructive"
                      className="mt-4 gap-2"
                      onClick={() => setLogoutConfirmOpen(true)}
                    >
                      <LogOut className="h-4 w-4" />
                      {t("auth.logout")}
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </main>
      <Footer />

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent className="sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auth.logoutTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("auth.logoutDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>{t("auth.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleLogout();
              }}
              disabled={loggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loggingOut ? t("auth.loggingOut") : t("auth.logoutConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={logoutSuccessOpen}
        onOpenChange={(o) => {
          setLogoutSuccessOpen(o);
          if (!o) navigate("/", { replace: true });
        }}
      >
        <DialogContent className="max-w-sm sm:rounded-2xl">
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <DialogHeader className="space-y-2 text-center sm:text-center">
              <DialogTitle className="font-heading text-xl">
                {t("auth.logoutSuccessTitle")}
              </DialogTitle>
              <DialogDescription>{t("auth.logoutSuccessBody")}</DialogDescription>
            </DialogHeader>
            <Button
              className="mt-1 w-full"
              onClick={() => {
                setLogoutSuccessOpen(false);
                navigate("/", { replace: true });
              }}
            >
              {t("auth.ok")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
