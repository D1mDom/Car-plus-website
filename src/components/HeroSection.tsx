import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ImagePlus } from "lucide-react";
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
import { useAdmin } from "@/hooks/useAdmin";
import { useBanners } from "@/hooks/useBanners";
import BannerManagerDialog from "@/components/admin/BannerManagerDialog";
import { onImgError } from "@/lib/imageFallback";

// Shown when no banners have been uploaded yet.
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
  const { isAdmin } = useAdmin();
  const { data: banners = [] } = useBanners();
  const [managerOpen, setManagerOpen] = useState(false);

  // Use uploaded banners when present, otherwise the built-in default slides.
  const slides = banners.length > 0
    ? banners.map((b) => ({ image: b.image, alt: "បដា Car Plus" }))
    : DEFAULT_SLIDES;

  // If the slide count shrinks (e.g. banners load and replace the defaults),
  // keep the active index in range so a slide is always shown.
  useEffect(() => {
    if (current > slides.length - 1) setCurrent(0);
  }, [slides.length, current]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [api]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  return (
    <section className="relative h-[clamp(200px,36vw,460px)] flex items-center justify-center overflow-hidden rounded-xl bg-muted">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            current === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Blurred, zoomed copy fills the empty side space so there are no gray
              bars, while the sharp banner below stays fully visible (uncropped). */}
          <img
            src={slide.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
          />
          <img src={slide.image} alt={slide.alt} onError={onImgError} className="relative h-full w-full object-contain" />
        </div>
      ))}

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
        onClick={scrollNext}
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

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === index
                ? "w-8 bg-primary"
                : "w-2 bg-foreground/30 hover:bg-foreground/50"
            }`}
          />
        ))}
      </div>

      {isAdmin && (
        <Button
          size="sm"
          className="absolute right-4 top-4 z-20 gap-1.5 shadow-md"
          onClick={() => setManagerOpen(true)}
        >
          <ImagePlus className="h-4 w-4" />
          គ្រប់គ្រងបដា
        </Button>
      )}
      {isAdmin && <BannerManagerDialog open={managerOpen} onOpenChange={setManagerOpen} />}
    </section>
  );
};

export default HeroSection;
