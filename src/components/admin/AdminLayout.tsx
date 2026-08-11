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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
import { useEffect, useMemo, useState } from "react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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

  const NavGroup = ({
    label,
    items,
    onNavigate,
  }: {
    label: string;
    items: NavItem[];
    onNavigate?: () => void;
  }) => (
    <div className="space-y-1">
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground))]/40">
        {label}
      </p>
      {items.map(({ to, end, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "admin-nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
              isActive
                ? "admin-nav-active bg-[hsl(350_70%_52%)] text-white shadow-sm"
                : "text-[hsl(var(--sidebar-foreground))]/75 hover:bg-[hsl(350_70%_52%/0.14)] hover:text-white"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className="truncate">{t(labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );

  const SidebarBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-5 py-5">
        <img src={logo} alt="Car Plus" className="h-10 w-auto rounded-md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">Car Plus</p>
          <p className="flex items-center gap-1 text-xs text-[hsl(var(--sidebar-foreground))]/55">
            <LayoutDashboard className="h-3 w-3" />
            {t("admin.dashboard")}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <NavGroup label={t("admin.nav.group.sales")} items={SALES_NAV} onNavigate={onNavigate} />
        <NavGroup label={t("admin.nav.group.website")} items={WEBSITE_NAV} onNavigate={onNavigate} />
        <NavGroup label={t("admin.nav.group.system")} items={SYSTEM_NAV} onNavigate={onNavigate} />
      </div>

      <div className="space-y-2 border-t border-[hsl(var(--sidebar-border))] p-4">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[hsl(var(--sidebar-foreground))]/60 transition-colors hover:bg-[hsl(350_70%_52%/0.14)] hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("admin.viewWebsite")}
        </Link>
        <p className="truncate px-3 text-xs text-[hsl(var(--sidebar-foreground))]/45">{email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[hsl(var(--sidebar-foreground))]/70 hover:bg-[hsl(350_70%_52%/0.14)] hover:text-white"
          onClick={() => setLogoutOpen(true)}
        >
          <LogOut className="h-4 w-4" />
          {t("admin.logout")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[hsl(210_28%_96%)] dark:bg-background">
      <aside className="hidden w-60 shrink-0 bg-[hsl(var(--sidebar-background))] lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <SidebarBody />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/80 bg-background/85 px-[10px] backdrop-blur-md sm:gap-3 lg:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label={t("nav.openMenu")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 border-0 bg-[hsl(var(--sidebar-background))] p-0 [&>button]:text-white">
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div key={pathname} className="min-w-0 flex-1 animate-admin-header">
            <p className="truncate text-sm font-semibold text-foreground">{t(page.title)}</p>
            <p className="truncate text-xs text-muted-foreground">{t(page.sub)}</p>
          </div>

          {mounted && (
            <>
              <LanguageSwitcher />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 transition-transform active:scale-95"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label={isDark ? t("theme.light") : t("theme.dark")}
              >
                {isDark ? (
                  <Sun key="sun" className="h-4 w-4 animate-admin-icon-swap" />
                ) : (
                  <Moon key="moon" className="h-4 w-4 animate-admin-icon-swap" />
                )}
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" asChild className="hidden gap-1.5 transition-transform hover:-translate-y-0.5 sm:inline-flex">
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              {t("admin.website")}
            </Link>
          </Button>
        </header>

        <main className="flex-1 px-[10px] py-6 lg:px-8 lg:py-8">
          <div key={pathname} className="animate-admin-page">
            <Outlet />
          </div>
        </main>
      </div>

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
