import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfilePersonalForm from "@/components/ProfilePersonalForm";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, type Profile } from "@/hooks/useProfile";
import { useLanguage } from "@/hooks/useLanguage";
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
  ImagePlus,
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
  const { data: profile, isLoading, save, uploadAvatarFile } = useProfile();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<SectionId>("personal");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [telegram, setTelegram] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
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
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || isLoading || contactReady.current) return;
    const meta = user.user_metadata ?? {};
    setAvatarUrl(
      profile?.avatar_url ||
        (typeof meta.avatar_url === "string" ? meta.avatar_url : "") ||
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
    setTelegram(saved.telegram ?? telegram);
    setPreferredTime(saved.preferred_time ?? preferredTime);
  };

  const onSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await save.mutateAsync({
        full_name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        address: profile?.address ?? "",
        avatar_url: avatarUrl || null,
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
        full_name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        address: profile?.address ?? "",
        avatar_url: url,
        telegram: profile?.telegram ?? telegram,
        preferred_time: profile?.preferred_time ?? preferredTime,
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
        full_name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        address: profile?.address ?? "",
        avatar_url: null,
        telegram: profile?.telegram ?? telegram,
        preferred_time: profile?.preferred_time ?? preferredTime,
      });
      toast.success(t("profile.avatarRemoved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.saveFail"));
    } finally {
      setUploading(false);
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-16">
        <section className="relative overflow-hidden border-b border-border/60 bg-[linear-gradient(165deg,hsl(216_45%_14%)_0%,hsl(210_35%_22%)_48%,hsl(199_55%_28%)_100%)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 55% 45% at 85% 15%, hsl(199 100% 55% / 0.28), transparent 60%)",
            }}
          />
          <div className="container relative mx-auto max-w-5xl px-[10px] py-8 sm:py-10">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-3xl font-bold text-white ring-1 ring-white/20 sm:h-24 sm:w-24">
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
                  className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#174080] text-white shadow-md ring-2 ring-[hsl(216_45%_18%)] transition hover:bg-[#143871] disabled:opacity-60"
                  aria-label={t("profile.avatarChange")}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
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
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5b8fd4]]">
                  {t("profile.settingsEyebrow")}
                </p>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {displayName}
                </h1>
                <p className="mt-1 truncate text-sm text-white/75">{user.email}</p>
                <p className="mt-2 text-sm text-white/65">{t("profile.subtitle")}</p>
                {memberSince && (
                  <p className="mt-1 text-xs text-white/50">
                    {t("profile.memberSince")}: {memberSince}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-5xl px-[10px] py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {NAV.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                    section === id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(label)}
                </button>
              ))}
            </nav>

            <div className="min-w-0 space-y-6">
              {isLoading && (section === "personal" || section === "contact") ? (
                <div className="flex justify-center rounded-2xl border border-border/70 bg-card py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : null}

              {section === "personal" && !isLoading && (
                <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
                  <div className="mb-5 border-b border-border/60 pb-4">
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      {t("profile.details")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("profile.detailsDesc")}</p>
                  </div>

                  <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-xl font-semibold text-muted-foreground">
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
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{t("profile.avatarTitle")}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t("profile.avatarHint")}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={uploading}
                          onClick={() => fileRef.current?.click()}
                        >
                          {uploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ImagePlus className="h-3.5 w-3.5" />
                          )}
                          {t("profile.avatarUpload")}
                        </Button>
                        {avatarUrl && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            disabled={uploading}
                            onClick={() => void onRemoveAvatar()}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t("profile.avatarRemove")}
                          </Button>
                        )}
                      </div>
                    </div>
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
                <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
                  <div className="mb-5 border-b border-border/60 pb-4">
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
                <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
                  <div className="mb-5 border-b border-border/60 pb-4">
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
                <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
                  <div className="mb-5 border-b border-border/60 pb-4">
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      {t("profile.preferencesTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("profile.preferencesDesc")}</p>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("profile.language")}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t("profile.languageHint")}</p>
                    </div>
                  </div>
                </div>
              )}

              {section === "shortcuts" && (
                <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
                  <div className="mb-5 border-b border-border/60 pb-4">
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
                        className="group flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
                <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
                  <div className="mb-5 border-b border-border/60 pb-4">
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
