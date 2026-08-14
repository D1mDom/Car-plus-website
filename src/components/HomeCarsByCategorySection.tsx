import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CarFront, Loader2 } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import CarCard from "@/components/CarCard";
import { useCars, type CarStatus } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import {
  countCarsByStatus,
  getCarsByStatus,
  getPublicCars,
  STATUS_CATEGORIES,
} from "@/lib/carUtils";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/i18n/translations";

const PER_CATEGORY = 8;
const FILTERED_LIMIT = 16;

const CATEGORY_KEYS: Record<CarStatus, TranslationKey> = {
  onroad: "category.onroad",
  ready: "category.ready",
  luxury: "category.luxury",
  plate: "category.plate",
};

const HomeCarsByCategorySection = () => {
  const { data: cars = [], isLoading } = useCars();
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<CarStatus | "all">("all");

  const counts = useMemo(() => countCarsByStatus(cars), [cars]);
  const publicCars = useMemo(() => getPublicCars(cars), [cars]);

  const filteredCars = useMemo(() => {
    if (activeCategory === "all") return [];
    return getCarsByStatus(cars, activeCategory, FILTERED_LIMIT);
  }, [cars, activeCategory]);

  const categoryBlocks = useMemo(
    () =>
      STATUS_CATEGORIES.map((status) => ({
        status,
        cars: getCarsByStatus(cars, status, PER_CATEGORY),
        total: counts[status],
      })).filter((block) => block.total > 0),
    [cars, counts],
  );

  if (!isLoading && publicCars.length === 0) return null;

  return (
    <section className="border-t border-border/60 bg-muted/20 py-10 sm:py-14">
      <div className="container mx-auto max-w-7xl px-[10px]">
        <div className="mb-6 sm:mb-8">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            <CarFront className="h-4 w-4" />
            {t("home.categories.eyebrow")}
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("home.categories.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t("home.categories.subtitle")}
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            counts={counts}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#174080]" />
          </div>
        ) : activeCategory === "all" ? (
          <div className="space-y-12">
            {categoryBlocks.map(({ status, cars: blockCars, total }) => (
              <div key={status}>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                      {t(CATEGORY_KEYS[status])}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("home.categories.count").replace("{count}", String(total))}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link to={`/cars?category=${status}`}>
                      {t("home.categories.viewCategory")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {blockCars.map((car) => (
                    <CarCard key={car.id} car={car} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {t("home.categories.showing").replace("{count}", String(filteredCars.length))}
                {counts[activeCategory] > filteredCars.length
                  ? ` ${t("home.categories.ofTotal").replace("{total}", String(counts[activeCategory]))}`
                  : ""}
              </p>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to={`/cars?category=${activeCategory}`}>
                  {t("home.viewAll")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
            {filteredCars.length === 0 && (
              <p className="py-12 text-center text-muted-foreground">{t("inventory.empty")}</p>
            )}
          </>
        )}

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" className="gap-2 bg-[#174080] hover:bg-[#143871]">
            <Link to="/cars">
              {t("home.categories.browseAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomeCarsByCategorySection;
