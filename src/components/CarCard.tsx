import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, getStatusLabel } from "@/hooks/useCars";
import { Images, Calendar, Fuel, Car as CarIcon, MessageCircle, Pencil, Trash2 } from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import { useContact } from "@/hooks/useContact";

interface CarCardProps {
  car: Car;
  // When provided (admin mode), inline edit/delete controls appear on the card.
  onEdit?: (car: Car) => void;
  onDelete?: (car: Car) => void;
}

const CarCard = ({ car, onEdit, onDelete }: CarCardProps) => {
  const { data: contact } = useContact();
  const adminMode = Boolean(onEdit || onDelete);
  const telegram = (contact?.telegram || "@Carplus777").replace(/^@/, "");

  // A car may have several photos. Let people preview them on the card (hover a
  // dot on desktop, tap a dot on mobile) without opening the detail page.
  const images = car.images && car.images.length > 0 ? car.images : [car.image];
  const [active, setActive] = useState(0);
  const hasMultiple = images.length > 1;

  // If photos change (e.g. an admin removes one), keep the preview index in range.
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

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-300 hover:border-primary/40">
      <Link to={`/car/${car.id}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={images[active] || car.image}
            alt={car.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Photo count */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
              <Images className="h-3.5 w-3.5" />
              {active + 1}/{images.length}
            </div>
          )}
          {/* Wishlist - top right */}
          <div className="absolute right-3 top-3">
            <WishlistButton carId={car.id} />
          </div>
          {/* Admin inline controls */}
          {adminMode && (
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(car); }}
                  aria-label="កែសម្រួល"
                  className="rounded-full bg-white/95 p-2 text-primary shadow-md transition-colors hover:bg-white"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(car); }}
                  aria-label="លុប"
                  className="rounded-full bg-white/95 p-2 text-destructive shadow-md transition-colors hover:bg-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {/* Preview dots */}
          {hasMultiple && (
            <>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`រូបភាព ${i + 1}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={(e) => previewImage(e, i)}
                    className={`h-1.5 rounded-full shadow transition-all ${
                      active === i ? "w-4 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-4 pb-3">
          <p className="inline-block rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {car.code}
          </p>
          <h3 className="mt-1.5 line-clamp-1 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {car.name}
          </h3>
          <p className="mt-1 text-xl font-bold text-primary sm:text-2xl">
            ${car.price.toLocaleString()}
          </p>

          {/* Spec micro-badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {getStatusLabel(car.status)}
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

      {/* CTA buttons */}
      <div className="mt-auto flex gap-2 border-t border-border p-3">
        <Button asChild size="sm" className="flex-1">
          <Link to={`/car/${car.id}`}>លម្អិត</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="flex-1">
          <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            ទំនាក់ទំនង
          </a>
        </Button>
      </div>
    </Card>
  );
};

export default CarCard;
