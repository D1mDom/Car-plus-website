import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, LogIn, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { useBanners } from "@/hooks/useBanners";
import { useLanguage } from "@/hooks/useLanguage";
import { onImgError } from "@/lib/imageFallback";
import { cn } from "@/lib/utils";
import slide1Bg from "@/assets/slides/slide-1-christmas.jpg";
import slide2Bg from "@/assets/slides/slide-2-newyear.jpg";
import slide3Bg from "@/assets/slides/slide-3-showroom.jpg";
import slide4Bg from "@/assets/slides/slide-4-coupon.jpg";
import slide5Bg from "@/assets/slides/slide-5-service.jpg";

const DEFAULT_SLIDES = [
  slide1Bg,
  slide2Bg,
  slide3Bg,
  slide4Bg,
  slide5Bg,
];

const HeroSection = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: banners = [] } = useBanners();
  const [current, setCurrent] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [loginSuccessOpen, setLoginSuccessOpen] = useState(false);
  const [query, setQuery] = useState("");

  const slides = banners.length > 0 ? banners.map((b) => b.image) : DEFAULT_SLIDES;
  const hasAdminBanners = banners.length > 0;
  const hasMultiple = slides.length > 1;

  useEffect(() => {
    if (current > slides.length - 1) setCurrent(0);
  }, [slides.length, current]);

  useEffect(() => {
    if (!hasMultiple) return;
    const interval = setInterval(() => {
      setCurrent((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [hasMultiple, slides.length]);

  const scrollPrev = useCallback(() => {
    setCurrent((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const scrollNext = useCallback(() => {
    setCurrent((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/cars?q=${encodeURIComponent(q)}` : "/cars");
  };

  return (
    <section className="relative overflow-hidden bg-black">
      <div className="relative aspect-[21/9] min-h-[340px] w-full sm:min-h-[400px] md:min-h-[460px] lg:min-h-[540px]">
        {slides.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              current === index ? "opacity-100" : "opacity-0"
            )}
          >
            <img
              src={src}
              alt=""
              onError={onImgError}
              className="h-full w-full object-cover object-center"
            />
          </div>
        ))}

        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-transparent",
            hasAdminBanners && "from-black/40 via-transparent to-transparent"
          )}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" aria-hidden="true" />

        {!hasAdminBanners && (
          <div className="absolute inset-0 z-10 flex items-center pb-28 sm:pb-32">
            <div className="container mx-auto px-[10px] sm:px-6">
              <div className="max-w-lg animate-hero-in text-left">
                <h1 className="font-heading text-3xl font-extrabold uppercase leading-[1.02] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                  {t("hero.headline")}
                  <br />
                  <span className="text-white">{t("hero.headlineAccent")}</span>
                </h1>
                <p className="mt-4 text-xs font-light uppercase tracking-[0.18em] text-white/85 sm:text-sm">
                  {t("hero.subtitleShort")}
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-7 h-11 rounded-none bg-[hsl(350_72%_42%)] px-9 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[hsl(350_72%_36%)] sm:text-sm"
                >
                  <Link to="/cars">{t("hero.ctaMore")}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Login or Search — always on hero banner */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-[10px] pb-5 sm:pb-7">
          <div className="container mx-auto max-w-2xl">
            <div className="rounded-xl border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-sm sm:p-4">
              {authLoading ? (
                <div className="h-12 animate-pulse rounded-lg bg-muted" />
              ) : user ? (
                <form onSubmit={handleSearch}>
                  <p className="mb-2 text-sm font-semibold text-foreground sm:text-base">
                    {t("hero.searchTitle")}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("home.search.placeholder")}
                        className="h-11 border-border bg-background pl-11"
                      />
                    </div>
                    <Button type="submit" className="h-11 gap-2 px-6 font-semibold">
                      {t("home.search.button")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{t("hero.loginPrompt")}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t("hero.loginHint")}</p>
                  </div>
                  <Button
                    type="button"
                    className="h-11 shrink-0 gap-2 px-6 font-semibold"
                    onClick={() => setAuthOpen(true)}
                  >
                    <LogIn className="h-4 w-4" />
                    {t("auth.signIn")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasMultiple && (
          <div className="absolute bottom-[7.5rem] right-[10px] z-20 flex items-center gap-3 sm:bottom-[8.5rem] sm:right-8">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous banner"
              className="text-white/90 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`Banner ${index + 1}`}
                  className={cn(
                    "h-2 w-2 transition-colors duration-300",
                    current === index
                      ? "bg-[hsl(350_72%_45%)]"
                      : "bg-white/80 hover:bg-white"
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next banner"
              className="text-white/90 transition-colors hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onLoginSuccess={() => setLoginSuccessOpen(true)}
        onSignupSuccess={() => setLoginSuccessOpen(true)}
      />

      <Dialog open={loginSuccessOpen} onOpenChange={setLoginSuccessOpen}>
        <DialogContent className="max-w-sm sm:rounded-2xl">
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <DialogHeader className="space-y-2 text-center sm:text-center">
              <DialogTitle className="font-heading text-xl">
                {t("auth.loginSuccessTitle")}
              </DialogTitle>
              <DialogDescription>{t("auth.loginSuccessBody")}</DialogDescription>
            </DialogHeader>
            <Button className="mt-1 w-full" onClick={() => setLoginSuccessOpen(false)}>
              {t("auth.ok")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HeroSection;
