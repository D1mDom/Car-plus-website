import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, getStatusLabel, CarStatus } from "@/hooks/useCars";
import { Eye, Images } from "lucide-react";
import WishlistButton from "@/components/WishlistButton";

interface CarCardProps {
  car: Car;
}

const getStatusVariant = (status: CarStatus): "ready" | "onroad" | "luxury" | "plate" => {
  return status;
};

const CarCard = ({ car }: CarCardProps) => {
  // A car may have several photos. Let people preview them on the card (hover a
  // dot on desktop, tap a dot on mobile) without opening the detail page.
  const images = car.images && car.images.length > 0 ? car.images : [car.image];
  const [active, setActive] = useState(0);
  const hasMultiple = images.length > 1;

  const previewImage = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(index);
  };

  return (
    <Link to={`/car/${car.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={images[active] || car.image}
            alt={car.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Status badge - top left */}
          <Badge
            variant={getStatusVariant(car.status)}
            className="absolute left-3 top-3 border-0 shadow-sm"
          >
            {getStatusLabel(car.status)}
          </Badge>
          {/* Photo count - shows there's more than one photo */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
              <Images className="h-3.5 w-3.5" />
              {active + 1}/{images.length}
            </div>
          )}
          {/* Wishlist - top right, always visible so it works on touch/phones */}
          <div className="absolute right-3 top-3">
            <WishlistButton carId={car.id} />
          </div>
          {/* Preview dots - flip through photos without leaving the page */}
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

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <p className="inline-block rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {car.code}
            </p>
            <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {car.name}
            </h3>
          </div>

          <div className="mt-auto flex items-end justify-between">
            <p className="text-xl font-bold text-primary sm:text-2xl">
              ${car.price.toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{car.viewers}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default CarCard;
