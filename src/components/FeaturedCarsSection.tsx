import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import CarCard from "@/components/CarCard";
import { useCars } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { getFeaturedCars } from "@/lib/carUtils";
import { Button } from "@/components/ui/button";

const FeaturedCarsSection = () => {
  const { data: cars = [] } = useCars();
  const { t } = useLanguage();
  const featured = getFeaturedCars(cars, 4);

  if (featured.length === 0) return null;

  return (
    <section className="border-t border-border/60 bg-card py-10 sm:py-14">
      <div className="container mx-auto max-w-7xl px-[10px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              <Star className="h-4 w-4 fill-primary" />
              {t("home.featured.eyebrow")}
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("home.featured.title")}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
              {t("home.featured.subtitle")}
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/cars">
              {t("home.viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((car) => (
            <CarCard key={car.id} car={car} featured />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarsSection;
