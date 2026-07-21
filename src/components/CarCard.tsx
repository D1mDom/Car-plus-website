import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, getStatusLabel, CarStatus } from "@/hooks/useCars";
import { Eye, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import WishlistButton from "@/components/WishlistButton";

interface CarCardProps {
  car: Car;
}

const getStatusVariant = (status: CarStatus): "ready" | "onroad" | "luxury" | "plate" => {
  return status;
};

const CarCard = ({ car }: CarCardProps) => {
  const { addToCart, items } = useCart();
  const isInCart = items.some((item) => item.car_id === car.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(car.id);
  };

  return (
    <Link to={`/car/${car.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={car.image}
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
          {/* Actions - top right, always visible so they work on touch/phones */}
          <div className="absolute right-3 top-3 flex gap-2">
            <WishlistButton carId={car.id} />
            <Button
              size="icon"
              variant={isInCart ? "default" : "secondary"}
              className="h-9 w-9 rounded-full bg-background/90 shadow-sm backdrop-blur-sm hover:bg-background"
              onClick={handleAddToCart}
              disabled={isInCart}
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
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
