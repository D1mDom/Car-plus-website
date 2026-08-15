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
  Shield,
  ChevronDown,
  Globe,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
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
import { useEffect, useMemo, useState } from "react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useUserRole } from "@/hooks/useUserRoles";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import {
  AdminOrderNotificationProvider,
  useAdminOrderNotifications,
} from "@/hooks/useAdminOrderNotifications";
import { navPathToModule, routeToModule, type AdminModule } from "@/lib/modulePermissions";
import AppDataMenu from "@/components/AppDataMenu";
import AdminOrderNotifications from "@/components/admin/AdminOrderNotifications";
import AdminOrderAlertBanner from "@/components/admin/AdminOrderAlertBanner";

type NavItem = { to: string; end: boolean; labelKey: TranslationKey; icon: typeof Car };

const SALES_NAV: NavItem[] = [
  { to: "/admin", end: true, labelKey: "admin.nav.dashboard", icon: LayoutDashboard },
  { to: "/admin/cars", end: false, labelKey: "admin.nav.cars", icon: Car },
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
  { to: "/admin/users", end: false, labelKey: "admin.nav.users", icon: Shield },
  { to: "/admin/settings", end: false, labelKey: "admin.nav.settings", icon: Settings },
];

const systemNavForRole = (canManageUsers: boolean) =>
  canManageUsers ? SYSTEM_NAV : SYSTEM_NAV.filter((i) => i.to !== "/admin/users");

const filterNavByRead = (items: NavItem[], canRead: (mod: AdminModule) => boolean) =>
  items.filter((item) => {
    const mod = navPathToModule(item.to);
    return mod ? canRead(mod) : true;
  });

const PAGE_META: { match: (path: string) => boolean; title: TranslationKey; sub: TranslationKey }[] = [
  { match: (p) => p.startsWith("/admin/add-car"), title: "admin.addCar.title", sub: "admin.addCar.subtitle" },
  { match: (p) => p === "/admin" || p === "/admin/", title: "admin.dashboard.title", sub: "admin.dashboard.subtitle" },
  { match: (p) => p.startsWith("/admin/cars"), title: "admin.cars.title", sub: "admin.cars.subtitle" },
  { match: (p) => p.startsWith("/admin/orders"), title: "admin.orders.title", sub: "admin.orders.subtitle" },
  { match: (p) => p.startsWith("/admin/receipts"), title: "admin.receipts.title", sub: "admin.receipts.subtitle" },
  { match: (p) => p.startsWith("/admin/reports"), title: "admin.reports.title", sub: "admin.reports.subtitle" },
  { match: (p) => p.startsWith("/admin/banners"), title: "admin.banners.title", sub: "admin.banners.subtitle" },
  { match: (p) => p.startsWith("/admin/brands"), title: "admin.brands.title", sub: "admin.brands.subtitle" },
  { match: (p) => p.startsWith("/admin/team"), title: "admin.team.title", sub: "admin.team.subtitle" },
  { match: (p) => p.startsWith("/admin/contact"), title: "admin.contact.title", sub: "admin.contact.subtitle" },
  { match: (p) => p.startsWith("/admin/users"), title: "admin.users.title", sub: "admin.users.subtitle" },
  { match: (p) => p.startsWith("/admin/settings"), title: "admin.settings.title", sub: "admin.settings.subtitle" },
];

function TopNavLink({
  item,
  onNavigate,
  compact,
}: {
  item: NavItem;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const Icon = item.icon;
  const label = t(item.labelKey);

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={label}
      className={({ isActive }) =>
        cn(
          "inline-flex shrink-0 items-center rounded-lg font-medium transition-colors",
          compact ? "gap-1.5 px-2 py-1.5 text-xs xl:px-2.5 xl:text-sm" : "gap-2 px-3 py-2 text-sm",
          isActive
            ? "bg-[#174080] text-white shadow-sm"
            : "text-[hsl(var(--sidebar-foreground))]/80 hover:bg-[#174080]/20 hover:text-white",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn("whitespace-nowrap", compact && "hidden xl:inline")}>{label}</span>
    </NavLink>
  );
}

function NavGroupDropdown({
  labelKey,
  items,
  onNavigate,
}: {
  labelKey: TranslationKey;
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const label = t(labelKey);
  const isActive = items.some((item) =>
    item.end ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to),
  );

  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          title={label}
          className={cn(
            "h-8 shrink-0 gap-1 rounded-lg px-2 text-xs font-medium xl:h-9 xl:px-2.5 xl:text-sm",
            isActive
              ? "bg-[#174080] text-white shadow-sm hover:bg-[#174080] hover:text-white"
              : "text-[hsl(var(--sidebar-foreground))]/80 hover:bg-[#174080]/20 hover:text-white",
          )}
        >
          <Globe className="h-4 w-4 shrink-0" />
          <span className="hidden xl:inline">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 rounded-xl border-slate-200 p-1.5 shadow-lg">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.to} asChild className="cursor-pointer rounded-lg">
              <Link
                to={item.to}
                onClick={onNavigate}
                className="flex items-center gap-2.5 px-2 py-2"
              >
                <Icon className="h-4 w-4 text-[#174080]" />
                <span>{t(item.labelKey)}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const AdminOrderSeenSync = () => {
  const { pathname } = useLocation();
  const { markAllSeen } = useAdminOrderNotifications();

  useEffect(() => {
    if (pathname.startsWith("/admin/orders")) markAllSeen();
  }, [pathname, markAllSeen]);

  return null;
};

const AdminLayoutBody = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { canManageUsers, isLoading: roleLoading } = useUserRole();
  const { canReadModule } = useModulePermissions();
  const canReadOrders = !roleLoading && canReadModule("orders");
  const salesNav = useMemo(
    () => (roleLoading ? SALES_NAV : filterNavByRead(SALES_NAV, canReadModule)),
    [roleLoading, canReadModule],
  );
  const websiteNav = useMemo(
    () => (roleLoading ? WEBSITE_NAV : filterNavByRead(WEBSITE_NAV, canReadModule)),
    [roleLoading, canReadModule],
  );
  const systemNav = useMemo(
    () =>
      roleLoading
        ? systemNavForRole(canManageUsers)
        : filterNavByRead(systemNavForRole(canManageUsers), canReadModule),
    [canManageUsers, canReadModule, roleLoading],
  );
  const email = user?.email ?? "";

  useEffect(() => setMounted(true), []);

  const currentModule = routeToModule(pathname);
  useEffect(() => {
    // Role defaults to "customer" while loading — skip checks until resolved.
    if (roleLoading) return;
    if (!currentModule || canReadModule(currentModule)) return;

    toast.error(t("admin.permissions.denied"));

    const allNav = [...salesNav, ...websiteNav, ...systemNav];
    const fallback = allNav[0]?.to;
    if (fallback && fallback !== pathname) {
      navigate(fallback, { replace: true });
    }
  }, [currentModule, canReadModule, navigate, t, roleLoading, pathname, salesNav, websiteNav, systemNav]);

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
        <MobileNavGroup label={t("admin.nav.group.sales")} items={salesNav} onNavigate={onNavigate} />
        <MobileNavGroup label={t("admin.nav.group.website")} items={websiteNav} onNavigate={onNavigate} />
        <MobileNavGroup label={t("admin.nav.group.system")} items={systemNav} onNavigate={onNavigate} />
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
      <AdminOrderSeenSync />
      {/* Top navbar — Car Plus brand bar (like old sidebar) */}
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] shadow-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-1.5 px-3 sm:gap-2 sm:px-4 lg:px-6">
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
          <Link to="/admin" className="flex shrink-0 items-center gap-2">
            <img src={logo} alt="Car Plus" className="h-8 w-auto rounded-md ring-1 ring-white/10" />
            <span className="hidden font-semibold leading-none text-[hsl(var(--sidebar-foreground))] md:inline lg:hidden xl:inline">
              Car Plus
            </span>
          </Link>

          <div className="mx-0.5 hidden h-6 w-px shrink-0 bg-[hsl(var(--sidebar-border))] lg:block" aria-hidden />

          {/* Horizontal nav links */}
          <nav
            className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex"
            aria-label="Admin navigation"
          >
            {salesNav.map((item) => (
              <TopNavLink key={item.to} item={item} compact />
            ))}
            <NavGroupDropdown labelKey="admin.nav.group.website" items={websiteNav} />
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {canReadOrders ? <AdminOrderNotifications /> : null}

            <LanguageSwitcher tone="admin" className="inline-flex shrink-0" />

            <AppDataMenu scope="admin" tone="admin" />

            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-[hsl(var(--sidebar-foreground))]/80 hover:bg-[#174080]/20 hover:text-white"
                    title={t("admin.nav.account")}
                    aria-label={t("admin.nav.account")}
                  >
                    <User className="h-[1.15rem] w-[1.15rem]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200 p-1.5 shadow-lg">
                  <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                    <p className="text-xs text-muted-foreground">{t("admin.nav.loggedInAs")}</p>
                    <p className="truncate text-sm font-semibold text-foreground">{email || "admin"}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canManageUsers ? (
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                      <Link to="/admin/users" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {t("admin.nav.users")}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
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
        <div key={pathname} className="mx-auto max-w-[1600px] animate-admin-header space-y-3 px-3 py-3 sm:px-4 lg:px-6">
          {canReadOrders && !pathname.startsWith("/admin/orders") ? <AdminOrderAlertBanner /> : null}
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-foreground sm:text-xl">
              {t(page.title)}
            </h1>
            <p className="text-sm text-slate-500 dark:text-muted-foreground">{t(page.sub)}</p>
          </div>
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

const AdminLayout = () => (
  <AdminOrderNotificationProvider>
    <AdminLayoutBody />
  </AdminOrderNotificationProvider>
);

export default AdminLayout;
