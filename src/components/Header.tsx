import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Megaphone, Menu, Package, Home, Car, Info, Phone, Send, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";
import UserMenu from "@/components/UserMenu";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { usePromotion } from "@/hooks/usePromotion";
import { useContact } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const Header = () => {
  const { items } = useWishlist();
  const { user } = useAuth();
  const { promotionText } = usePromotion();
  const { data: contact } = useContact();
  const { t, lang, toggleLang } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const telegramDisplay = contact?.telegram || "@Carplus777";
  const telegramHandle = telegramDisplay.replace(/^@/, "");
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMounted(true), []);

  const NAV_ITEMS = [
    { id: "home", label: t("nav.home"), section: "", icon: Home },
    { id: "inventory", label: t("nav.inventory"), section: "inventory", icon: Car },
    { id: "about", label: t("nav.about"), section: "about", icon: Info },
    { id: "contact", label: t("nav.contact"), section: "contact", icon: Phone },
  ] as const;

  const headerOffset = promotionText ? 96 : 72;
  const isDark = (resolvedTheme ?? theme) === "dark";

  const scrollToSection = useCallback((id: string) => {
    if (!id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActive("home");
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, [headerOffset]);

  const handleNav = (e: React.MouseEvent, section: string, navId: string) => {
    e.preventDefault();
    setActive(navId);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToSection(section), 140);
    } else {
      scrollToSection(section);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      if (location.pathname !== "/") return;
      if (window.scrollY < 160) {
        setActive("home");
        return;
      }
      const sections = NAV_ITEMS.filter((n) => n.section);
      let current = "home";
      for (const n of sections) {
        const el = document.getElementById(n.section);
        if (!el) continue;
        if (el.getBoundingClientRect().top - headerOffset <= 48) current = n.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname, headerOffset, lang]);

  const onHome = location.pathname === "/";
  const overHero = onHome && !scrolled;

  const iconBtn = cn(
    "h-9 w-9 rounded-xl border shadow-sm transition-colors [&_svg]:h-5 [&_svg]:w-5 [&_svg]:stroke-[2]",
    overHero
      ? "border-white/40 bg-black/35 text-white hover:bg-black/50 hover:text-white"
      : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary"
  );

  const goTo = (path: "/orders" | "/wishlist") => {
    navigate(user ? path : "/auth");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {promotionText && (
          <div className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-primary to-sky-400 px-[10px] py-1.5 text-primary-foreground">
            <Megaphone className="h-3.5 w-3.5 shrink-0 opacity-90" />
            <p className="text-center text-xs font-semibold tracking-wide sm:text-sm">{promotionText}</p>
          </div>
        )}

        <div
          className={cn(
            "border-b transition-all duration-300",
            overHero
              ? "border-transparent bg-transparent"
              : "border-border/60 bg-background/90 shadow-sm backdrop-blur-xl"
          )}
        >
          <div className="container mx-auto px-[10px]">
            <div className={cn("relative flex items-center justify-between gap-2 transition-all duration-300", scrolled ? "h-14" : "h-16")}>
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon" aria-label={t("nav.openMenu")} className={iconBtn}>
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="flex w-[300px] flex-col p-0">
                    <SheetHeader className="border-b border-border px-5 py-5 text-left">
                      <SheetTitle className="flex items-center gap-3">
                        <img src={logo} alt="Car Plus" className="h-11 w-auto rounded-lg" />
                        <span className="font-heading text-base font-semibold">Car Plus</span>
                      </SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-1 flex-col gap-1 p-[10px]">
                      <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("nav.menu")}
                      </p>
                      {NAV_ITEMS.map(({ id, label, section, icon: Icon }) => (
                        <SheetClose asChild key={id}>
                          <Link
                            to={section ? `/#${section}` : "/"}
                            onClick={(e) => handleNav(e, section, id)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors",
                              active === id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                            )}
                          >
                            <Icon className="h-[18px] w-[18px]" />
                            {label}
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>
                    <div className="space-y-2 border-t border-border p-[10px]">
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={toggleLang}>
                          {lang === "km" ? "EN" : "ខ្មែរ"}
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => setTheme(isDark ? "light" : "dark")}>
                          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          {isDark ? t("theme.light") : t("theme.dark")}
                        </Button>
                      </div>
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

                <Link to="/" onClick={(e) => handleNav(e, "", "home")} className="flex items-center gap-2.5">
                  <img
                    src={logo}
                    alt="Car Plus"
                    className={cn("w-auto rounded-lg transition-all duration-300", scrolled ? "h-10" : "h-12")}
                  />
                </Link>
              </div>

              <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex" aria-label="Primary">
                {NAV_ITEMS.map(({ id, label, section }) => {
                  const isActive = active === id && onHome;
                  return (
                    <Link
                      key={id}
                      to={section ? `/#${section}` : "/"}
                      onClick={(e) => handleNav(e, section, id)}
                      className={cn(
                        "relative px-3.5 py-2 text-sm font-medium transition-colors",
                        overHero
                          ? isActive ? "text-white" : "text-white/70 hover:text-white"
                          : isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {label}
                      <span
                        className={cn(
                          "absolute inset-x-3 -bottom-0.5 h-0.5 rounded-sm transition-all duration-300",
                          isActive ? (overHero ? "bg-white" : "bg-primary") : "bg-transparent"
                        )}
                      />
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-1.5">
                {mounted && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={iconBtn}
                      onClick={toggleLang}
                      aria-label={lang === "km" ? "Switch to English" : "ប្តូរទៅខ្មែរ"}
                      title={lang === "km" ? "EN" : "ខ្មែរ"}
                    >
                      <span className="text-[11px] font-bold tracking-wide">{lang === "km" ? "EN" : "ខ្មែរ"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={iconBtn}
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
                  className={iconBtn}
                  aria-label={t("nav.orders")}
                  title={t("nav.orders")}
                  onClick={() => goTo("/orders")}
                >
                  <Package className="h-[18px] w-[18px]" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("relative", iconBtn)}
                  aria-label={t("nav.wishlist")}
                  title={t("nav.wishlist")}
                  onClick={() => goTo("/wishlist")}
                >
                  <Heart className={cn("h-[18px] w-[18px]", items.length > 0 && "fill-primary text-primary")} />
                  {items.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-md bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {items.length}
                    </span>
                  )}
                </Button>

                <div className={cn(overHero && "[&_button]:border-white/30 [&_button]:bg-white/10 [&_button]:text-white [&_button]:hover:bg-white/20")}>
                  <UserMenu />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {!onHome && <div className={promotionText ? "h-24" : "h-16"} aria-hidden="true" />}
      {onHome && promotionText && <div className="h-8" aria-hidden="true" />}
    </>
  );
};

export default Header;
