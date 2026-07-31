import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import CategoryFilter from "@/components/CategoryFilter";
import CarCard from "@/components/CarCard";
import CarListItem from "@/components/CarListItem";
import AboutSection from "@/components/AboutSection";
import LocationMap from "@/components/LocationMap";
import FilterPanel, { FilterState, defaultFilters } from "@/components/FilterPanel";
import InventoryToolbar, { SortOption, ViewMode } from "@/components/InventoryToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCars, type CarStatus } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";

const Index = () => {
  const { t } = useLanguage();
  const { data: carsData = [], isLoading } = useCars();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CarStatus | "all">("all");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const priceRange = useMemo(() => {
    if (carsData.length === 0) return { min: 0, max: 100000 };
    const prices = carsData.map((c) => c.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [carsData]);

  useEffect(() => {
    if (carsData.length === 0) return;
    setFilters((f) =>
      f.priceMin === defaultFilters.priceMin && f.priceMax === defaultFilters.priceMax
        ? { ...f, priceMin: priceRange.min, priceMax: priceRange.max }
        : f
    );
  }, [carsData, priceRange]);

  const filteredAndSortedCars = useMemo(() => {
    let result = carsData.filter((car) => {
      const matchesSearch =
        car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || car.status === activeCategory;
      const matchesYearMin = filters.yearMin === null || car.year >= filters.yearMin;
      const matchesYearMax = filters.yearMax === null || car.year <= filters.yearMax;
      const matchesFuelType = filters.fuelType === null || car.fuelType === filters.fuelType;
      const matchesColor = filters.color === null || car.color === filters.color;
      const matchesPrice = car.price >= filters.priceMin && car.price <= filters.priceMax;
      return matchesSearch && matchesCategory && matchesYearMin && matchesYearMax && matchesFuelType && matchesColor && matchesPrice;
    });

    switch (sortBy) {
      case "price-asc": result = result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result = result.sort((a, b) => b.price - a.price); break;
      case "year-desc": result = result.sort((a, b) => b.year - a.year); break;
      case "year-asc": result = result.sort((a, b) => a.year - b.year); break;
      case "newest": default: break;
    }
    return result;
  }, [carsData, searchQuery, activeCategory, filters, sortBy]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background bg-mesh">
      <Header />
      <main>
        <HeroSection />

        <section id="inventory" className="relative mx-auto scroll-mt-20 py-10 sm:py-14">
          <div className="container mx-auto max-w-7xl px-[10px]">
            <div className="mb-5 max-w-2xl animate-slide-up sm:mb-6 mx-auto">

              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-center">
                {t("inventory.title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base text-center">
                {t("inventory.subtitle")}
              </p>
            </div>

            <div className="mb-4 rounded-2xl border border-border/70 bg-card p-[10px] shadow-sm">
              <div className="mb-3 flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t("inventory.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 border-border bg-background pl-11"
                  />
                </div>
                <Button size="lg" variant="outline" className="h-11 shrink-0 gap-2 px-5" onClick={() => setFilterPanelOpen(true)}>
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("inventory.filter")}
                </Button>
              </div>
              <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            </div>

            <InventoryToolbar
              totalCars={carsData.length}
              filteredCount={filteredAndSortedCars.length}
              activeCategory={activeCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAndSortedCars.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredAndSortedCars.map((car, index) => (
                    <div
                      key={car.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
                    >
                      <CarCard car={car} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAndSortedCars.map((car, index) => (
                    <div
                      key={car.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                    >
                      <CarListItem car={car} />
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
                <p className="text-lg text-muted-foreground">{t("inventory.empty")}</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                    setFilters({ ...defaultFilters, priceMin: priceRange.min, priceMax: priceRange.max });
                  }}
                  className="mt-4 font-medium text-primary hover:underline"
                >
                  {t("inventory.clearFilters")}
                </button>
              </div>
            )}
          </div>
        </section>

        <AboutSection />
        <LocationMap />
      </main>
      <Footer />
      <FilterPanel open={filterPanelOpen} onOpenChange={setFilterPanelOpen} filters={filters} onFiltersChange={setFilters} />
    </div>
  );
};

export default Index;
