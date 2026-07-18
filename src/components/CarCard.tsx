import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
    <Link to={`/car/${car.id}`}>
      <Card className="group overflow-hidden cursor-pointer border-2 hover:border-primary/50 transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={car.image}
            alt={car.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <Badge variant={getStatusVariant(car.status)} className="absolute top-4 left-4 border-2">
            {getStatusLabel(car.status)}
          </Badge>
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <WishlistButton carId={car.id} />
            <Button
              size="icon"
              variant={isInCart ? "default" : "secondary"}
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleAddToCart}
              disabled={isInCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-mono border border-border rounded px-2 py-0.5 inline-block">{car.code}</p>
              <h3 className="mt-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors text-bordered-light">
                {car.name}
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gradient-ocean">
                ${car.price.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 text-muted-foreground border border-border rounded-full px-2 py-1">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{car.viewers}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CarCard;
