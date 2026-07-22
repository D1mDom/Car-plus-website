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
import { useCars, type CarStatus, type Car } from "@/hooks/useCars";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";

const Index = () => {
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

  // Once cars load, widen the price filter to the real range so nothing is
  // hidden by the default $100k cap (unless the user has already changed it).
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
  }, [searchQuery, activeCategory, filters, sortBy]);

  const handleFilterClick = () => {
    setFilterPanelOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container mx-auto px-4 pt-4">
          <HeroSection />
        </div>

        <section id="inventory" className="py-6">
          <div className="container mx-auto px-4">
            {/* Search + filter row (full width, below the banner) */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ស្វែងរកតាមឈ្មោះ ឬម៉ូដែល..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 border-border bg-background pl-12"
                />
              </div>
              <Button size="lg" className="h-12 gap-2 px-6" onClick={handleFilterClick}>
                <SlidersHorizontal className="h-5 w-5" />
                តម្រង
              </Button>
            </div>

            {/* Category chips (left-aligned) */}
            <div className="mb-4">
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
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAndSortedCars.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filteredAndSortedCars.map((car, index) => (
                    <div key={car.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <CarCard car={car} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAndSortedCars.map((car, index) => (
                    <div key={car.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <CarListItem car={car} />
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">រកមិនឃើញឡានដែលត្រូវនឹងលក្ខណៈវិនិច្ឆ័យរបស់អ្នក។</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                    setFilters({ ...defaultFilters, priceMin: priceRange.min, priceMax: priceRange.max });
                  }}
                  className="mt-4 text-primary hover:underline"
                >
                  សម្អាតតម្រងទាំងអស់
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
