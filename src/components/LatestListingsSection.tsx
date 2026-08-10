import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import CarCard from "@/components/CarCard";
import { useCars } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { getFeaturedCars, getLatestCars } from "@/lib/carUtils";
import { Button } from "@/components/ui/button";

const LatestListingsSection = () => {
  const { data: cars = [] } = useCars();
  const { t } = useLanguage();
  // Avoid showing the same cars already listed in Featured above.
  const featuredIds = getFeaturedCars(cars, 4).map((c) => c.id);
  const latest = getLatestCars(cars, 4, featuredIds);

  if (latest.length === 0) return null;

  return (
    <section className="border-t border-border/60 py-10 sm:py-14">
      <div className="container mx-auto max-w-7xl px-[10px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-4 w-4" />
              {t("home.latest.eyebrow")}
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("home.latest.title")}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
              {t("home.latest.subtitle")}
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
          {latest.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestListingsSection;
