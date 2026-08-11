import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Phone,
  Image,
  Users,
  Tag,
  LogOut,
  ExternalLink,
  Menu,
  Car,
  Plus,
  FileText,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Database,
  Loader2,
  RefreshCw,
  Flame,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useEffect, useMemo, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";
import type { Lang } from "@/i18n/translations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import flagEn from "@/assets/flags/flag-en.png";
import flagKh from "@/assets/flags/flag-kh.png";

type NavItem = { to: string; end: boolean; labelKey: TranslationKey; icon: typeof Car };

const SALES_NAV: NavItem[] = [
  { to: "/admin", end: true, labelKey: "admin.nav.cars", icon: Car },
  { to: "/admin/add-car", end: false, labelKey: "admin.nav.addCar", icon: Plus },
  { to: "/admin/orders", end: false, labelKey: "admin.nav.orders", icon: Package },
  { to: "/admin/receipts", end: false, labelKey: "admin.nav.receipts", icon: FileText },
  { to: "/admin/reports", end: false, labelKey: "admin.nav.reports", icon: BarChart3 },
];

const WEBSITE_NAV: NavItem[] = [
  { to: "/admin/banners", end: false, labelKey: "admin.nav.banners", icon: Image },
  { to: "/admin/brands", end: false, labelKey: "admin.nav.brands", icon: Tag },
  { to: "/admin/team", end: false, labelKey: "admin.nav.team", icon: Users },
  { to: "/admin/contact", end: false, labelKey: "admin.nav.contact", icon: Phone },
];

const SYSTEM_NAV: NavItem[] = [
  { to: "/admin/settings", end: false, labelKey: "admin.nav.settings", icon: Settings },
];

const TOP_NAV: NavItem[] = [...SALES_NAV, ...WEBSITE_NAV];

const PAGE_META: { match: (path: string) => boolean; title: TranslationKey; sub: TranslationKey }[] = [
  { match: (p) => p.startsWith("/admin/add-car"), title: "admin.addCar.title", sub: "admin.addCar.subtitle" },
  { match: (p) => p === "/admin" || p === "/admin/", title: "admin.cars.title", sub: "admin.cars.subtitle" },
  { match: (p) => p.startsWith("/admin/orders"), title: "admin.orders.title", sub: "admin.orders.subtitle" },
  { match: (p) => p.startsWith("/admin/receipts"), title: "admin.receipts.title", sub: "admin.receipts.subtitle" },
  { match: (p) => p.startsWith("/admin/reports"), title: "admin.reports.title", sub: "admin.reports.subtitle" },
  { match: (p) => p.startsWith("/admin/banners"), title: "admin.banners.title", sub: "admin.banners.subtitle" },
  { match: (p) => p.startsWith("/admin/brands"), title: "admin.brands.title", sub: "admin.brands.subtitle" },
  { match: (p) => p.startsWith("/admin/team"), title: "admin.team.title", sub: "admin.team.subtitle" },
  { match: (p) => p.startsWith("/admin/contact"), title: "admin.contact.title", sub: "admin.contact.subtitle" },
  { match: (p) => p.startsWith("/admin/settings"), title: "admin.settings.title", sub: "admin.settings.subtitle" },
];

function TopNavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { t } = useLanguage();
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-[#174080] text-white shadow-sm"
            : "text-[hsl(var(--sidebar-foreground))]/80 hover:bg-[#174080]/20 hover:text-white"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">{t(item.labelKey)}</span>
    </NavLink>
  );
}

const ADMIN_QUERY_PREFIXES = [
  "cars",
  "admin-orders",
  "admin-receipts",
  "reports",
  "banners",
  "team-members",
  "contact-info",
  "brands",
] as const;

type DataAction = "refresh" | "warm" | "clear" | null;

function DataMenuRow({
  icon: Icon,
  title,
  description,
  tone,
  busy,
  onClick,
}: {
  icon: typeof RefreshCw;
  title: string;
  description: string;
  tone: "brand" | "green" | "red";
  busy?: boolean;
  onClick: () => void;
}) {
  const tones = {
    brand: {
      icon: "bg-[#174080]/12 text-[#174080]",
      title: "text-[#174080]",
      hover: "hover:bg-[#174080]/8 focus:bg-[#174080]/8",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600",
      title: "text-emerald-700",
      hover: "hover:bg-emerald-50/80 focus:bg-emerald-50/80",
    },
    red: {
      // Dashboard theme: turn "danger" tone into brand blue to match "red -> blue all".
      icon: "bg-[#174080]/12 text-[#174080]",
      title: "text-[#174080]",
      hover: "hover:bg-[#174080]/8 focus:bg-[#174080]/8",
    },
  }[tone];

  return (
    <DropdownMenuItem
      className={cn("cursor-pointer rounded-xl p-2", tones.hover)}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={busy}
    >
      <div className="flex w-full items-start gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones.icon)}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
        </span>
        <span className="min-w-0 pt-0.5">
          <span className={cn("block text-sm font-semibold leading-tight", tones.title)}>{title}</span>
          <span className="mt-0.5 block text-xs leading-snug text-slate-500">{description}</span>
        </span>
      </div>
    </DropdownMenuItem>
  );
}

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [dataAction, setDataAction] = useState<DataAction>(null);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const email = user?.email ?? "";
  const isDark = (resolvedTheme ?? theme) === "dark";

  useEffect(() => setMounted(true), []);

  const page = useMemo(
    () => PAGE_META.find((m) => m.match(pathname)) ?? PAGE_META[0],
    [pathname]
  );

  const handleSignOut = async () => {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    setLogoutOpen(false);
    navigate("/admin/login", { replace: true });
  };

  const refetchAdminQueries = useCallback(async () => {
    await queryClient.invalidateQueries();
    await queryClient.refetchQueries({ type: "active" });
  }, [queryClient]);

  const handleRefreshData = useCallback(async () => {
    if (dataAction) return;
    setDataAction("refresh");
    try {
      await refetchAdminQueries();
      toast.success(t("admin.data.refreshDone"));
      setDataMenuOpen(false);
    } catch {
      toast.error(t("admin.data.error"));
    } finally {
      setDataAction(null);
    }
  }, [dataAction, refetchAdminQueries, t]);

  const handleWarmCache = useCallback(async () => {
    if (dataAction) return;
    setDataAction("warm");
    try {
      await Promise.all(
        ADMIN_QUERY_PREFIXES.map((prefix) =>
          queryClient.refetchQueries({ queryKey: [prefix], type: "all" })
        )
      );
      toast.success(t("admin.data.warmDone"));
      setDataMenuOpen(false);
    } catch {
      toast.error(t("admin.data.error"));
    } finally {
      setDataAction(null);
    }
  }, [dataAction, queryClient, t]);

  const handleClearCache = useCallback(async () => {
    if (dataAction) return;
    setDataAction("clear");
    setDataMenuOpen(false);
    toast.message(t("admin.data.clearing"));
    try {
      queryClient.clear();
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      /* still reload */
    }
    window.location.reload();
  }, [dataAction, queryClient, t]);

  const setLanguage = (next: Lang) => setLang(next);

  const MobileNavGroup = ({
    label,
    items,
    onNavigate,
  }: {
    label: string;
    items: NavItem[];
    onNavigate?: () => void;
  }) => (
    <div className="space-y-1">
      <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--sidebar-foreground))]/40">
        {label}
      </p>
      {items.map((item) => (
        <TopNavLink key={item.to} item={item} onNavigate={onNavigate} />
      ))}
    </div>
  );

  const MobileNavBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col bg-[hsl(var(--sidebar-background))]">
      <div className="flex items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-4 py-4">
        <img src={logo} alt="Car Plus" className="h-9 w-auto rounded-md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">Car Plus</p>
          <p className="flex items-center gap-1 text-xs text-[hsl(var(--sidebar-foreground))]/55">
            <LayoutDashboard className="h-3 w-3" />
            {t("admin.dashboard")}
          </p>
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        <MobileNavGroup label={t("admin.nav.group.sales")} items={SALES_NAV} onNavigate={onNavigate} />
        <MobileNavGroup label={t("admin.nav.group.website")} items={WEBSITE_NAV} onNavigate={onNavigate} />
        <MobileNavGroup label={t("admin.nav.group.system")} items={SYSTEM_NAV} onNavigate={onNavigate} />
      </div>
      <div className="space-y-2 border-t border-[hsl(var(--sidebar-border))] p-4">
        <p className="truncate px-1 text-xs text-[hsl(var(--sidebar-foreground))]/45">{email}</p>
        <Button
          variant="ghost"
          size="sm"
              className="w-full justify-start gap-2 text-[hsl(var(--sidebar-foreground))]/70 hover:bg-[#174080]/15 hover:text-white"
          onClick={() => {
            onNavigate?.();
            setLogoutOpen(true);
          }}
        >
          <LogOut className="h-4 w-4" />
          {t("admin.logout")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard flex min-h-screen flex-col bg-[#f4f7fb] dark:bg-background">
      {/* Top navbar — Car Plus brand bar (like old sidebar) */}
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] shadow-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 sm:px-4 lg:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-[hsl(var(--sidebar-foreground))]/85 hover:bg-[#174080]/20 hover:text-white"
                aria-label={t("nav.openMenu")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[min(100vw-2rem,18rem)] border-0 bg-[hsl(var(--sidebar-background))] p-0 [&>button]:text-white"
            >
              <MobileNavBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Brand */}
          <Link to="/admin" className="flex shrink-0 items-center gap-2.5">
            <img src={logo} alt="Car Plus" className="h-8 w-auto rounded-md ring-1 ring-white/10" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold leading-tight text-[hsl(var(--sidebar-foreground))]">
                Car Plus
              </p>
              <p className="flex items-center gap-1 text-[11px] text-[hsl(var(--sidebar-foreground))]/55">
                <LayoutDashboard className="h-3 w-3" />
                {t("admin.dashboard")}
              </p>
            </div>
          </Link>

          <div className="mx-1 hidden h-6 w-px bg-[hsl(var(--sidebar-border))] lg:block" aria-hidden />

          {/* Horizontal nav links */}
          <nav
            className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex [&::-webkit-scrollbar]:hidden"
            aria-label="Admin navigation"
          >
            {TOP_NAV.map((item) => (
              <TopNavLink key={item.to} item={item} />
            ))}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher tone="admin" className="hidden sm:inline-flex" />

            <DropdownMenu open={dataMenuOpen} onOpenChange={setDataMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
              className="hidden h-9 w-9 text-[hsl(var(--sidebar-foreground))]/75 hover:bg-[#174080]/20 hover:text-white sm:inline-flex"
                  title={t("admin.data.title")}
                  aria-label={t("admin.data.title")}
                  disabled={!!dataAction}
                >
                  {dataAction ? (
                    <Loader2 className="h-[1.15rem] w-[1.15rem] animate-spin" />
                  ) : (
                    <Database className="h-[1.15rem] w-[1.15rem]" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[min(calc(100vw-2rem),17.5rem)] rounded-2xl border-slate-200 p-2 shadow-xl"
              >
                <DropdownMenuLabel className="px-2 py-2 text-base font-semibold text-[#174080]">
                  {t("admin.data.title")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DataMenuRow
                  icon={RefreshCw}
                  title={t("admin.data.refresh")}
                  description={t("admin.data.refreshDesc")}
                  tone="brand"
                  busy={dataAction === "refresh"}
                  onClick={() => void handleRefreshData()}
                />
                <DataMenuRow
                  icon={Flame}
                  title={t("admin.data.warm")}
                  description={t("admin.data.warmDesc")}
                  tone="green"
                  busy={dataAction === "warm"}
                  onClick={() => void handleWarmCache()}
                />
                <DropdownMenuSeparator />
                <DataMenuRow
                  icon={Trash2}
                  title={t("admin.data.clear")}
                  description={t("admin.data.clearDesc")}
                  tone="red"
                  busy={dataAction === "clear"}
                  onClick={() => void handleClearCache()}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-lg border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] px-2.5 text-[hsl(var(--sidebar-foreground))] shadow-sm hover:bg-[#174080]/15 hover:text-white sm:px-3"
                  >
                    <Settings className="h-4 w-4 opacity-80" />
                    <span className="hidden text-sm font-medium sm:inline">{t("admin.nav.settings")}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200 p-1.5 shadow-lg">
                  <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                    <p className="text-xs text-muted-foreground">{t("admin.nav.loggedInAs")}</p>
                    <p className="truncate text-sm font-semibold text-foreground">{email || "admin"}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                    <Link to="/admin/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {t("admin.nav.settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      {t("admin.viewWebsite")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg gap-2"
                    onClick={() => setLanguage("km")}
                  >
                    <img src={flagKh} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
                    {t("lang.km.native")}
                    {lang === "km" ? <span className="ml-auto text-xs text-[#174080]">✓</span> : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg gap-2"
                    onClick={() => setLanguage("en")}
                  >
                    <img src={flagEn} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
                    {t("lang.en.native")}
                    {lang === "en" ? <span className="ml-auto text-xs text-[#174080]">✓</span> : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg gap-2"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {isDark ? t("theme.light") : t("theme.dark")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg gap-2 text-[#174080] focus:bg-[#174080]/10 focus:text-[#174080]"
                    onClick={() => setLogoutOpen(true)}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("admin.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </header>

      {/* Page title strip */}
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-sm dark:border-border dark:bg-background/80">
        <div key={pathname} className="mx-auto max-w-[1600px] animate-admin-header px-3 py-3 sm:px-4 lg:px-6">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-foreground sm:text-xl">
            {t(page.title)}
          </h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground">{t(page.sub)}</p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-5 sm:px-4 lg:px-6 lg:py-6">
        <div key={pathname} className="animate-admin-page">
          <Outlet />
        </div>
      </main>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
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
                void handleSignOut();
              }}
              disabled={loggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loggingOut ? t("auth.loggingOut") : t("auth.logoutConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLayout;
