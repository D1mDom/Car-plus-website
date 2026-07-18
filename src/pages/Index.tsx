import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import CategoryFilter from "@/components/CategoryFilter";
import CarCard from "@/components/CarCard";
import CarListItem from "@/components/CarListItem";
import AboutSection from "@/components/AboutSection";
import FilterPanel, { FilterState, defaultFilters } from "@/components/FilterPanel";
import InventoryToolbar, { SortOption, ViewMode } from "@/components/InventoryToolbar";
import { useCars, type CarStatus, type Car } from "@/hooks/useCars";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { data: carsData = [], isLoading } = useCars();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CarStatus | "all">("all");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
        <HeroSection searchQuery={searchQuery} onSearchChange={setSearchQuery} onFilterClick={handleFilterClick} />

        <section id="inventory" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                ស្តុក<span className="text-gradient-gold">ឡានពិសេស</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                រុករករថយន្តគុណភាពដែលយើងបានជ្រើសរើស។ រថយន្តនីមួយៗមានធានា និងឯកសារពេញលេញ។
              </p>
            </div>

            <div className="mb-6">
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
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    setFilters(defaultFilters);
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
      </main>
      <Footer />
      <FilterPanel open={filterPanelOpen} onOpenChange={setFilterPanelOpen} filters={filters} onFiltersChange={setFilters} />
    </div>
  );
};

export default Index;
