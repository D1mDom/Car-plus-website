import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, getStatusLabel, CarStatus } from "@/hooks/useCars";
import { Eye, ShoppingCart, Calendar, Fuel, Gauge } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import WishlistButton from "@/components/WishlistButton";

interface CarListItemProps { car: Car; }

const getStatusVariant = (status: CarStatus): "ready" | "onroad" | "luxury" | "plate" => status;

const CarListItem = ({ car }: CarListItemProps) => {
  const { addToCart, items } = useCart();
  const isInCart = items.some((item) => item.car_id === car.id);

  const handleAddToCart = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); addToCart(car.id); };

  return (
    <Link to={`/car/${car.id}`}>
      <Card className="group overflow-hidden cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
          <img src={car.image} alt={car.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <Badge variant={getStatusVariant(car.status)} className="absolute top-3 left-3 border-2">{getStatusLabel(car.status)}</Badge>
        </div>
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground font-mono border border-border rounded px-2 py-0.5 inline-block">{car.code}</p>
                <h3 className="mt-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors text-bordered-light">{car.name}</h3>
              </div>
              <p className="text-2xl font-bold text-gradient-ocean">${car.price.toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /><span>{car.year}</span></div>
              <div className="flex items-center gap-1.5"><Fuel className="h-4 w-4" /><span>{car.fuelType}</span></div>
              <div className="flex items-center gap-1.5"><Eye className="h-4 w-4" /><span>{car.viewers} មើល</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <WishlistButton carId={car.id} variant="full" />
            <Button variant={isInCart ? "default" : "outline"} onClick={handleAddToCart} disabled={isInCart} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              {isInCart ? "ក្នុងកន្ត្រក" : "ដាក់ក្នុងកន្ត្រក"}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default CarListItem;
