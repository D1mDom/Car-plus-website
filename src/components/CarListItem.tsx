import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, CarStatus } from "@/hooks/useCars";
import { Eye, Calendar, Fuel } from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/i18n/translations";

interface CarListItemProps { car: Car; }

const getStatusVariant = (status: CarStatus): "ready" | "onroad" | "luxury" | "plate" => status;

const CarListItem = ({ car }: CarListItemProps) => {
  const { t } = useLanguage();
  const statusKey = `status.${car.status}` as TranslationKey;

  return (
    <Link to={`/car/${car.id}`}>
      <Card className="group flex cursor-pointer flex-col overflow-hidden border transition-all duration-300 hover:border-primary/50 sm:flex-row">
        <div className="relative h-48 w-full flex-shrink-0 overflow-hidden sm:h-auto sm:w-64">
          <img src={car.image} alt={car.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <Badge variant={getStatusVariant(car.status)} className="absolute left-3 top-3 border-2">{t(statusKey)}</Badge>
        </div>
        <div className="flex flex-1 flex-col justify-between p-[10px] sm:p-5">
          <div>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="inline-block rounded border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">{car.code}</p>
                <h3 className="mt-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">{car.name}</h3>
              </div>
              <p className="text-2xl font-bold text-primary">${car.price.toLocaleString()}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /><span>{car.year}</span></div>
              <div className="flex items-center gap-1.5"><Fuel className="h-4 w-4" /><span>{car.fuelType}</span></div>
              <div className="flex items-center gap-1.5"><Eye className="h-4 w-4" /><span>{car.viewers}</span></div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <WishlistButton carId={car.id} variant="full" />
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              {t("card.details")}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default CarListItem;
