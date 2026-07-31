import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Phone,
  Image,
  Users,
  LogOut,
  ExternalLink,
  Menu,
  Car,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const email = user?.email ?? "";
  const isDark = (resolvedTheme ?? theme) === "dark";

  useEffect(() => setMounted(true), []);

  const NAV: { to: string; end: boolean; labelKey: TranslationKey; icon: typeof Car }[] = [
    { to: "/admin", end: true, labelKey: "admin.nav.cars", icon: Car },
    { to: "/admin/orders", end: false, labelKey: "admin.nav.orders", icon: Package },
    { to: "/admin/reports", end: false, labelKey: "admin.nav.reports", icon: BarChart3 },
    { to: "/admin/banners", end: false, labelKey: "admin.nav.banners", icon: Image },
    { to: "/admin/team", end: false, labelKey: "admin.nav.team", icon: Users },
    { to: "/admin/contact", end: false, labelKey: "admin.nav.contact", icon: Phone },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(({ to, end, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                : "text-[hsl(var(--sidebar-foreground))]/75 hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
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

      <div className="flex-1 overflow-y-auto py-4">
        <NavItems onNavigate={onNavigate} />
      </div>

      <div className="space-y-2 border-t border-[hsl(var(--sidebar-border))] p-4">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[hsl(var(--sidebar-foreground))]/60 transition-colors hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("admin.viewWebsite")}
        </Link>
        <p className="truncate px-3 text-xs text-[hsl(var(--sidebar-foreground))]/45">{email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[hsl(var(--sidebar-foreground))]/70 hover:bg-[hsl(var(--sidebar-accent))] hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          {t("admin.logout")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 bg-[hsl(var(--sidebar-background))] lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <SidebarBody />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-[10px] backdrop-blur-md sm:gap-3 lg:px-8">
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

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{t("admin.dashboard")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("admin.dashboardSub")}</p>
          </div>

          {mounted && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 px-2.5"
                onClick={toggleLang}
                title={lang === "km" ? "EN" : "ខ្មែរ"}
              >
                <span className="text-xs font-bold">{lang === "km" ? "EN" : "ខ្មែរ"}</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label={isDark ? t("theme.light") : t("theme.dark")}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" asChild className="hidden gap-1.5 sm:inline-flex">
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              {t("admin.website")}
            </Link>
          </Button>
        </header>

        <main className="flex-1 px-[10px] py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
