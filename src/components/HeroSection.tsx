import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowDown } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import slide1Bg from "@/assets/slides/slide-1-christmas.jpg";
import slide2Bg from "@/assets/slides/slide-2-newyear.jpg";
import slide3Bg from "@/assets/slides/slide-3-showroom.jpg";
import slide4Bg from "@/assets/slides/slide-4-coupon.jpg";
import slide5Bg from "@/assets/slides/slide-5-service.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useBanners } from "@/hooks/useBanners";
import { onImgError } from "@/lib/imageFallback";
import { useLanguage } from "@/hooks/useLanguage";

const DEFAULT_SLIDES = [
  { image: slide1Bg, alt: "ប្រូម៉ូសិន Christmas" },
  { image: slide2Bg, alt: "ការអបអរឆ្នាំថ្មី" },
  { image: slide3Bg, alt: "សាល Car Plus" },
  { image: slide4Bg, alt: "ប្រូម៉ូសិនប័ណ្ណ" },
  { image: slide5Bg, alt: "សេវាកម្មគុណភាព" },
];

const HeroSection = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const { data: banners = [] } = useBanners();
  const { t } = useLanguage();

  const slides = banners.length > 0
    ? banners.map((b) => ({ image: b.image, alt: "បដា Car Plus" }))
    : DEFAULT_SLIDES;

  useEffect(() => {
    if (current > slides.length - 1) setCurrent(0);
  }, [slides.length, current]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => api.scrollNext(), 5500);
    return () => clearInterval(interval);
  }, [api]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  const goInventory = () => {
    const el = document.getElementById("inventory");
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative flex min-h-[min(72vh,620px)] w-full items-end sm:items-center">
        {/* Full-bleed slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              current === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              onError={onImgError}
              className={`h-full w-full object-cover transition-transform duration-[8000ms] ease-out ${
                current === index ? "scale-105" : "scale-100"
              }`}
            />
          </div>
        ))}

        {/* Readable brand plane — not a badge overlay */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />

        {/* Brand composition */}
        <div className="relative z-10 w-full px-[10px] pb-16 pt-28 sm:pb-20 lg:pt-24">
          <div className="mx-auto max-w-6xl">
            <p
              className="animate-hero-in mb-3 font-heading text-sm font-semibold uppercase tracking-[0.22em] text-white/75 sm:text-base"
              style={{ animationDelay: "80ms" }}
            >
              {t("hero.tagline")}
            </p>
            <h1
              className="animate-hero-in font-heading text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
              style={{ animationDelay: "160ms" }}
            >
              Car <span className="text-[hsl(199_100%_62%)]">Plus</span>
            </h1>
            <p
              className="animate-hero-in mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:mt-5 sm:text-lg"
              style={{ animationDelay: "280ms" }}
            >
              {t("hero.subtitle")}
            </p>
            <div
              className="animate-hero-in mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "400ms" }}
            >
              <Button
                size="lg"
                onClick={goInventory}
                className="h-12 gap-2 px-7 text-base font-semibold shadow-button"
              >
                {t("hero.ctaInventory")}
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const el = document.getElementById("contact");
                  if (!el) return;
                  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
                }}
                className="h-12 border-white/40 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur-sm hover:bg-white hover:text-foreground"
              >
                {t("hero.ctaContact")}
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 rounded-xl bg-white/15 text-white backdrop-blur-md hover:bg-white/30 sm:inline-flex md:left-6"
          onClick={scrollPrev}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 rounded-xl bg-white/15 text-white backdrop-blur-md hover:bg-white/30 sm:inline-flex md:right-6"
          onClick={scrollNext}
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        <Carousel setApi={setApi} opts={{ loop: true }} className="hidden">
          <CarouselContent>
            {slides.map((_, index) => (
              <CarouselItem key={index} />
            ))}
          </CarouselContent>
        </Carousel>

        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-sm transition-all duration-300 ${
                current === index ? "w-8 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
