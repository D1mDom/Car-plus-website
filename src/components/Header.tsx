import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Megaphone, Menu, Package, Car, Home, Info, Phone, Send, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";
import UserMenu from "@/components/UserMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import OrderAlertBanner from "@/components/OrderAlertBanner";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { usePromotion } from "@/hooks/usePromotion";
import { useContact } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const Header = () => {
  const { items } = useWishlist();
  const { user } = useAuth();
  const { promotionText } = usePromotion();
  const { data: contact } = useContact();
  const { t } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const telegramDisplay = contact?.telegram || "@Carplus777";
  const telegramHandle = telegramDisplay.replace(/^@/, "");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setMounted(true), []);

  const NAV_ITEMS = [
    { id: "home", label: t("nav.home"), path: "/", icon: Home },
    { id: "inventory", label: t("nav.inventory"), path: "/cars", icon: Car },
    { id: "orders", label: t("nav.orders"), path: "/orders", icon: Package },
    { id: "about", label: t("nav.about"), path: "/about", icon: Info },
    { id: "contact", label: t("nav.contact"), path: "/contact", icon: Phone },
  ] as const;

  const MOBILE_ITEMS = NAV_ITEMS;

  const isDark = (resolvedTheme ?? theme) === "dark";

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/contact") return location.pathname === "/contact";
    if (path === "/orders") return location.pathname.startsWith("/orders");
    return location.pathname.startsWith(path);
  };

  const goTo = (path: "/orders" | "/wishlist") => {
    navigate(user ? path : "/auth");
  };

  const iconBtnClass =
    "h-9 w-9 text-[hsl(244_30%_40%)] hover:bg-[#174080]/12 hover:text-[#174080] active:bg-[#174080]/20 active:text-[#143871]";

  const navLinkClass = (path: string) =>
    cn(
      "relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
      isActive(path)
        ? "bg-[#174080] text-white shadow-sm"
        : "text-[hsl(244_30%_40%)] hover:bg-[#174080]/12 hover:text-[#174080] active:bg-[#174080]/20 active:text-[#143871]"
    );

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {promotionText && (
        <div className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-[#174080] to-[#1a4a93] px-[10px] py-1.5 text-white">
          <Megaphone className="h-3.5 w-3.5 shrink-0 opacity-90" />
          <p className="text-center text-xs font-semibold tracking-wide sm:text-sm">{promotionText}</p>
        </div>
      )}

      <OrderAlertBanner />

      <div className="border-b border-slate-100">
        <div className="container mx-auto px-[10px]">
          <div className="flex h-[4.25rem] items-center justify-between gap-3 sm:h-[4.5rem]">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet>
                <SheetTrigger asChild className="lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("nav.openMenu")}
                    className={cn("shrink-0", iconBtnClass)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-[300px] flex-col p-0">
                  <SheetHeader className="border-b border-border px-5 py-5 text-left">
                    <SheetTitle className="flex items-center gap-3">
                      <img src={logo} alt="Car Plus" className="h-10 w-auto rounded-lg" />
                      <div>
                        <span className="font-heading text-base font-bold">Car Plus</span>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-[#174080]">
                          {t("hero.logoTagline")}
                        </p>
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-1 flex-col gap-1 p-[10px]">
                    {MOBILE_ITEMS.map(({ id, label, path, icon: Icon }) => (
                      <SheetClose asChild key={id}>
                        <Link
                          to={path}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors",
                            isActive(path)
                              ? "bg-[#174080] text-white shadow-sm"
                              : "text-foreground hover:bg-[#174080]/12 hover:text-[#174080] active:bg-[#174080]/20 active:text-[#143871]"
                          )}
                        >
                          <Icon className="h-[18px] w-[18px]" />
                          {label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="space-y-2 border-t border-border p-[10px]">
                    <a
                      href={`https://t.me/${telegramHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-semibold text-white"
                    >
                      <Send className="h-4 w-4" />
                      Telegram {telegramDisplay}
                    </a>
                  </div>
                </SheetContent>
              </Sheet>

              <Link to="/" className="flex min-w-0 items-center gap-2.5">
                <img src={logo} alt="Car Plus" className="h-10 w-auto shrink-0 rounded-lg sm:h-11" />
                <div className="hidden min-w-0 sm:block">
                  <p className="font-heading text-base font-bold leading-tight text-[hsl(244_45%_22%)] sm:text-lg">
                    Car Plus
                  </p>
                  <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-[#174080] sm:text-[10px]">
                    {t("hero.logoTagline")}
                  </p>
                </div>
              </Link>
            </div>

            <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
              {NAV_ITEMS.map(({ id, label, path }) => (
                <Link key={id} to={path} className={navLinkClass(path)}>
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              {mounted && (
                <>
                  <LanguageSwitcher />
                  <Button
                    variant="ghost"
                    size="icon"
                    className={iconBtnClass}
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    aria-label={isDark ? t("theme.light") : t("theme.dark")}
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("relative", iconBtnClass)}
                aria-label={t("nav.wishlist")}
                onClick={() => goTo("/wishlist")}
              >
                <Heart className={cn("h-[18px] w-[18px]", items.length > 0 && "fill-[#174080] text-[#174080]")} />
                {items.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#174080] px-1 text-[10px] font-semibold text-white">
                    {items.length}
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={iconBtnClass}
                aria-label={t("nav.orders")}
                title={t("nav.orders")}
                onClick={() => goTo("/orders")}
              >
                <Package className="h-[18px] w-[18px]" />
              </Button>

              <UserMenu
                signInClassName="hidden rounded-full bg-[#174080] px-5 font-semibold text-white hover:bg-[#143871] active:bg-[#0f2d5c] sm:inline-flex"
                signInLabel={t("auth.signIn")}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
