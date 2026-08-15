import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, CarStatus } from "@/hooks/useCars";
import { Eye, Calendar, Fuel } from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import CarDetailDialog from "@/components/CarDetailDialog";
import SoldOutBadge from "@/components/SoldOutBadge";
import { useLanguage } from "@/hooks/useLanguage";
import { useIsCarSold } from "@/hooks/useSoldCarIds";
import { onImgError } from "@/lib/imageFallback";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

interface CarListItemProps { car: Car; }

const getStatusVariant = (status: CarStatus): "ready" | "onroad" | "luxury" | "plate" => status;

const CarListItem = ({ car }: CarListItemProps) => {
  const { t } = useLanguage();
  const [detailOpen, setDetailOpen] = useState(false);
  const sold = useIsCarSold(car.id);
  const statusKey = `status.${car.status}` as TranslationKey;

  return (
    <>
      <Card className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md sm:flex-row">
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="relative h-44 w-full flex-shrink-0 overflow-hidden text-left sm:h-auto sm:w-64"
          aria-label={t("card.preview")}
        >
          <img
            src={car.image}
            alt={car.name}
            onError={onImgError}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
              sold && "grayscale",
            )}
          />
          {sold ? (
            <>
              <div className="absolute inset-0 z-[8] bg-black/45" />
              <SoldOutBadge className="absolute left-1/2 top-1/2 z-[9] -translate-x-1/2 -translate-y-1/2 -rotate-12" />
            </>
          ) : (
            <Badge variant={getStatusVariant(car.status)} className="absolute left-3 top-3 border-2">
              {t(statusKey)}
            </Badge>
          )}
        </button>
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex w-fit items-center rounded-full border border-border bg-background/60 px-2 py-1 font-mono text-xs text-muted-foreground">
                  {car.code}
                </p>
                <h3 className="mt-2 line-clamp-1 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                  {car.name}
                </h3>
              </div>
              <p className="text-2xl font-bold text-primary tabular-nums">${car.price.toLocaleString()}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{car.year}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fuel className="h-4 w-4" />
                <span>{car.fuelType}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{car.viewers}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <WishlistButton carId={car.id} variant="full" />
            <Button
              asChild
              variant="outline"
              className="gap-2 border-border/70 bg-background/60 hover:bg-background"
            >
              <Link to={`/car/${car.id}`}>
                <Eye className="h-4 w-4" />
                {t("card.details")}
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <CarDetailDialog car={car} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
};

export default CarListItem;
