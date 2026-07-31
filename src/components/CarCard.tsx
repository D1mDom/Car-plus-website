import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car } from "@/hooks/useCars";
import { Images, Calendar, Fuel, Car as CarIcon, MessageCircle, Pencil, Trash2, ShoppingCart } from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import { useContact } from "@/hooks/useContact";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import PlaceOrderDialog from "@/components/PlaceOrderDialog";
import { onImgError } from "@/lib/imageFallback";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TranslationKey } from "@/i18n/translations";

interface CarCardProps {
  car: Car;
  onEdit?: (car: Car) => void;
  onDelete?: (car: Car) => void;
}

const CarCard = ({ car, onEdit, onDelete }: CarCardProps) => {
  const { data: contact } = useContact();
  const { user } = useAuth();
  const { t } = useLanguage();
  // Ordering asks for a phone number first, so the card opens a dialog instead
  // of placing the order directly.
  const [orderCar, setOrderCar] = useState<Car | null>(null);
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

  const specs = [
    { icon: Calendar, value: car.year },
    { icon: Fuel, value: car.fuelType },
    { icon: CarIcon, value: car.bodyType },
  ];

  const statusKey = `status.${car.status}` as TranslationKey;

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-card">
        <Link to={`/car/${car.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
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
            <div className="absolute right-3 top-3 flex items-center gap-1.5">
              {/* Hidden in admin mode so managing stock can't create a real order. */}
              {!adminMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!user) { toast.error("សូមចូលគណនីជាមុនសិន"); return; }
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
              <div className="absolute bottom-3 right-3 flex gap-1.5">
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(car); }}
                    aria-label="កែសម្រួល"
                    className="rounded-xl bg-white/95 p-2 text-primary shadow-sm"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(car); }}
                    aria-label="លុប"
                    className="rounded-xl bg-white/95 p-2 text-destructive shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            {hasMultiple && (
              <>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`រូបភាព ${i + 1}`}
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
          </div>

          <div className="p-4 pb-3">
            <p className="inline-block rounded-md border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {car.code}
            </p>
            <h3 className="mt-1.5 line-clamp-1 font-heading text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {car.name}
            </h3>
            <p className="mt-1.5 font-heading text-xl font-bold text-primary sm:text-2xl">
              ${car.price.toLocaleString()}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {t(statusKey)}
              </span>
              {specs.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  <s.icon className="h-3.5 w-3.5" />
                  {s.value}
                </span>
              ))}
            </div>
          </div>
        </Link>

        <div className="mt-auto flex gap-2 border-t border-border/70 p-[10px]">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/car/${car.id}`}>{t("card.details")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              {t("card.contact")}
            </a>
          </Button>
        </div>
      </article>

      <PlaceOrderDialog car={orderCar} onOpenChange={(o) => { if (!o) setOrderCar(null); }} />
    </>
  );
};

export default CarCard;
