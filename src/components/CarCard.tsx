import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car } from "@/hooks/useCars";
import {
  Images,
  Calendar,
  Fuel,
  Car as CarIcon,
  MessageCircle,
  Pencil,
  Trash2,
  ShoppingCart,
  MapPin,
  Star,
} from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import { useContact } from "@/hooks/useContact";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import PlaceOrderDialog from "@/components/PlaceOrderDialog";
import CarDetailDialog from "@/components/CarDetailDialog";
import { onImgError } from "@/lib/imageFallback";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TranslationKey } from "@/i18n/translations";

interface CarCardProps {
  car: Car;
  onEdit?: (car: Car) => void;
  onDelete?: (car: Car) => void;
  featured?: boolean;
}

const CarCard = ({ car, onEdit, onDelete, featured }: CarCardProps) => {
  const { data: contact } = useContact();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orderCar, setOrderCar] = useState<Car | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const adminMode = Boolean(onEdit || onDelete);
  const telegram = (contact?.telegram || "@Carplus777").replace(/^@/, "");

  const images = car.images && car.images.length > 0 ? car.images : [car.image];
  const [active, setActive] = useState(0);
  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (active > images.length - 1) setActive(0);
  }, [images.length, active]);

  const previewImage = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(index);
  };

  const openPreview = () => {
    setDetailOpen(true);
  };

  const specs = [
    { icon: Calendar, value: car.year },
    { icon: Fuel, value: car.fuelType },
    { icon: CarIcon, value: car.bodyType },
  ];

  const statusKey = `status.${car.status}` as TranslationKey;

  const imageAreaClass = cn(
    "relative block aspect-[4/3] w-full cursor-pointer overflow-hidden bg-muted text-left",
  );

  const imageAreaContent = (
    <>
            {featured && (
              <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                <Star className="h-3 w-3 fill-white" />
                {t("card.featured")}
              </span>
            )}
            <img
              src={images[active] || car.image}
              alt={car.name}
              loading="lazy"
              onError={onImgError}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            {hasMultiple && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                <Images className="h-3.5 w-3.5" />
                {active + 1}/{images.length}
              </div>
            )}
            <div
              className="absolute right-3 top-3 z-10 flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {!adminMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!user) {
                      toast.error(t("order.loginRequired"));
                      return;
                    }
                    setOrderCar(car);
                  }}
                  aria-label={t("card.order")}
                  title={t("card.order")}
                  className="rounded-xl bg-white/95 p-2 text-primary shadow-sm transition-colors hover:bg-white"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              )}
              <WishlistButton carId={car.id} />
            </div>
            {adminMode && (
              <div
                className="absolute bottom-3 right-3 z-30 flex gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(car)}
                    aria-label={t("card.edit")}
                    className="rounded-xl bg-white/95 p-2 text-primary shadow-sm transition-colors hover:bg-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(car)}
                    aria-label={t("card.delete")}
                    className="rounded-xl bg-white/95 p-2 text-destructive shadow-sm transition-colors hover:bg-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            {hasMultiple && (
              <>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/45 to-transparent" />
                <div
                  className="absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`${t("card.photo")} ${i + 1}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={(e) => previewImage(e, i)}
                      className={cn(
                        "h-1.5 rounded-sm shadow transition-all",
                        active === i ? "w-4 bg-white" : "w-1.5 bg-white/55 hover:bg-white/90"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
    </>
  );

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg">
        <div className="block w-full text-left">
          <div
            className={imageAreaClass}
            role="button"
            tabIndex={0}
            onClick={openPreview}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPreview();
              }
            }}
            aria-label={t("card.preview")}
          >
            {imageAreaContent}
          </div>

          <div className="flex flex-1 flex-col gap-2 p-5">
            <p className="inline-flex w-fit items-center rounded-full border border-border bg-background/60 px-2 py-1 font-mono text-[11px] text-muted-foreground">
              {car.code}
            </p>
            <h3 className="line-clamp-1 font-heading text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {car.name}
            </h3>
            <div className="flex items-end justify-between gap-3">
              <p className="font-heading text-xl font-bold text-primary tabular-nums sm:text-2xl">
                ${car.price.toLocaleString()}
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {t("card.location")}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{t("card.location")}</span>
            </div>

            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                {t(statusKey)}
              </span>
              {specs.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-1 text-xs text-muted-foreground"
                >
                  <s.icon className="h-3.5 w-3.5" />
                  {s.value}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-2 border-t border-border/60 bg-muted/15 p-4">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/car/${car.id}`}>{t("card.details")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1 border-border/70">
            <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              {t("card.contact")}
            </a>
          </Button>
        </div>
      </article>

      <PlaceOrderDialog car={orderCar} onOpenChange={(o) => { if (!o) setOrderCar(null); }} />
      <CarDetailDialog car={car} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
};

export default CarCard;
