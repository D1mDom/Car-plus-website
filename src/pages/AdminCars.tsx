import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCars, type Car as CarType, type CarStatus } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, X, Car, Search, SlidersHorizontal } from "lucide-react";
import CarCard from "@/components/CarCard";
import CarListItem from "@/components/CarListItem";
import CarFormDialog from "@/components/admin/CarFormDialog";
import CategoryFilter, { bodyTypeLabel } from "@/components/CategoryFilter";
import BodyTypeSearch from "@/components/BodyTypeSearch";
import FilterPanel, { FilterState, defaultFilters } from "@/components/FilterPanel";
import InventoryToolbar, { SortOption, ViewMode } from "@/components/InventoryToolbar";
import {
  carMatchesBrand,
  carMatchesBrandSearch,
  carMatchesCategory,
  extractBrand,
  listCarBrands,
  normalizeBodyType,
} from "@/lib/carUtils";
import { cn } from "@/lib/utils";

const CAR_STATUSES = ["ready", "onroad", "luxury", "plate"] as const;

const AdminCars = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: cars, isLoading } = useCars();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CarStatus | "all">("all");
  const [visibleFilter, setVisibleFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && CAR_STATUSES.includes(status as (typeof CAR_STATUSES)[number])) {
      setStatusFilter(status as CarStatus);
    } else {
      setStatusFilter("all");
    }
  }, [searchParams]);

  const setStatusTab = (value: CarStatus | "all") => {
    setStatusFilter(value);
    if (value === "all") {
      searchParams.delete("status");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ status: value }, { replace: true });
    }
  };

  const realCars = useMemo(
    () => (cars ?? []).filter((c) => !String(c.id).startsWith("mock-")),
    [cars],
  );

  const priceRange = useMemo(() => {
    if (realCars.length === 0) return { min: 0, max: 100000 };
    const prices = realCars.map((c) => c.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [realCars]);

  useEffect(() => {
    if (realCars.length === 0) return;
    setFilters((f) =>
      f.priceMin === defaultFilters.priceMin && f.priceMax === defaultFilters.priceMax
        ? { ...f, priceMin: priceRange.min, priceMax: priceRange.max }
        : f,
    );
  }, [realCars, priceRange]);

  const matchesWithoutBrand = (car: CarType) => {
    const q = search.trim().toLowerCase();
    const bodyNorm = normalizeBodyType(car.bodyType);
    const matchesSearch =
      !q ||
      car.name.toLowerCase().includes(q) ||
      car.model.toLowerCase().includes(q) ||
      (car.code ?? "").toLowerCase().includes(q) ||
      (car.plateNumber ?? "").toLowerCase().includes(q) ||
      (car.bodyType ?? "").toLowerCase().includes(q) ||
      bodyNorm.toLowerCase().includes(q) ||
      bodyTypeLabel(bodyNorm || car.bodyType, t).toLowerCase().includes(q);
    const matchesYearMin = filters.yearMin === null || car.year >= filters.yearMin;
    const matchesYearMax = filters.yearMax === null || car.year <= filters.yearMax;
    const matchesFuelType = filters.fuelType === null || car.fuelType === filters.fuelType;
    const matchesColor = filters.color === null || car.color === filters.color;
    const matchesPrice = car.price >= filters.priceMin && car.price <= filters.priceMax;
    const matchesVisible =
      visibleFilter === "all" ||
      (visibleFilter === "visible" && car.isActive) ||
      (visibleFilter === "hidden" && !car.isActive);
    return matchesSearch && matchesYearMin && matchesYearMax && matchesFuelType && matchesColor && matchesPrice && matchesVisible;
  };

  const matchesBaseFilters = (car: CarType) => {
    const matchesBrand = brandFilter
      ? carMatchesBrand(car.name, brandFilter)
      : carMatchesBrandSearch(car, brandSearchQuery);
    return matchesWithoutBrand(car) && matchesBrand;
  };

  const categoryCounts = useMemo(() => {
    const base = realCars.filter((car) => matchesBaseFilters(car));
    const tallies = { all: base.length, onroad: 0, ready: 0, luxury: 0, plate: 0 };
    for (const car of base) {
      if (carMatchesCategory(car, "onroad")) tallies.onroad++;
      if (carMatchesCategory(car, "ready")) tallies.ready++;
      if (carMatchesCategory(car, "luxury")) tallies.luxury++;
      if (carMatchesCategory(car, "plate")) tallies.plate++;
    }
    return tallies;
  }, [realCars, search, filters, brandFilter, brandSearchQuery, visibleFilter, t]);

  const brandCounts = useMemo(() => {
    const base = realCars.filter((car) => {
      const matchesCategory = carMatchesCategory(car, statusFilter);
      return matchesWithoutBrand(car) && matchesCategory;
    });
    const lower: Record<string, number> = {};
    for (const car of base) {
      const brand = extractBrand(car.name).trim();
      if (!brand) continue;
      const key = brand.toLowerCase();
      lower[key] = (lower[key] ?? 0) + 1;
    }
    const counts: Record<string, number> = { all: base.length };
    for (const brand of listCarBrands(realCars)) {
      counts[brand] = lower[brand.toLowerCase()] ?? 0;
    }
    return counts;
  }, [realCars, search, filters, statusFilter, visibleFilter, t]);

  const brands = useMemo(
    () => listCarBrands(realCars).filter((brand) => (brandCounts[brand] ?? 0) > 0 || brand === brandFilter),
    [realCars, brandCounts, brandFilter],
  );

  const filteredCars = useMemo(() => {
    let result = realCars.filter((car) => {
      const matchesCategory = carMatchesCategory(car, statusFilter);
      return matchesBaseFilters(car) && matchesCategory;
    });
    switch (sortBy) {
      case "price-asc": result = result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result = result.sort((a, b) => b.price - a.price); break;
      case "year-desc": result = result.sort((a, b) => b.year - a.year); break;
      case "year-asc": result = result.sort((a, b) => a.year - b.year); break;
      default: break;
    }
    return result;
  }, [realCars, search, statusFilter, brandFilter, brandSearchQuery, filters, visibleFilter, sortBy, t]);

  const isPriceDefault = filters.priceMin === priceRange.min && filters.priceMax === priceRange.max;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setVisibleFilter("all");
    setBrandFilter(null);
    setBrandSearchQuery("");
    setFilters({ ...defaultFilters, priceMin: priceRange.min, priceMax: priceRange.max });
    setSearchParams({}, { replace: true });
  };

  const handleEdit = (car: CarType) => {
    setEditingCar(car);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    if (!open) {
      setFormOpen(false);
      setEditingCar(null);
    }
  };

  const formatPrice = (price: number) => `$${Number(price).toLocaleString()}`;

  const chips = [
    search.trim()
      ? { key: "search", label: search.trim().slice(0, 40), onClear: () => setSearch("") }
      : null,
    statusFilter !== "all"
      ? { key: "status", label: t(`category.${statusFilter}` as "category.ready"), onClear: () => setStatusTab("all") }
      : null,
    brandFilter
      ? { key: "brand", label: brandFilter, onClear: () => setBrandFilter(null) }
      : null,
    brandSearchQuery.trim()
      ? { key: "brandSearch", label: brandSearchQuery.trim(), onClear: () => setBrandSearchQuery("") }
      : null,
    visibleFilter !== "all"
      ? {
          key: "visible",
          label: visibleFilter === "visible" ? t("admin.cars.visible") : t("admin.cars.hidden"),
          onClear: () => setVisibleFilter("all"),
        }
      : null,
    !isPriceDefault
      ? {
          key: "price",
          label: `${formatPrice(filters.priceMin)} – ${formatPrice(filters.priceMax)}`,
          onClear: () => setFilters((f) => ({ ...f, priceMin: priceRange.min, priceMax: priceRange.max })),
        }
      : null,
  ].filter(Boolean) as { key: string; label: string; onClear: () => void }[];

  const SkeletonBlock = ({ className }: { className: string }) => (
    <div className={cn("animate-pulse rounded-2xl bg-muted/50", className)} />
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted-foreground">{t("admin.cars.pageHint")}</p>
        <Button asChild className="shrink-0 gap-1.5">
          <Link to="/admin/add-car">
            <Plus className="h-4 w-4" />
            {t("admin.cars.add")}
          </Link>
        </Button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onClear}
              className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="max-w-[220px] truncate">{chip.label}</span>
              <span className="text-muted-foreground group-hover:text-primary">×</span>
            </button>
          ))}
          <button type="button" onClick={clearFilters} className="ml-auto text-sm font-semibold text-primary hover:underline">
            {t("inventory.clearFilters")}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-2.5 p-3 sm:flex-row sm:p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("inventory.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-border/80 bg-background pl-11"
            />
          </div>
          <BodyTypeSearch
            value={brandFilter ?? "all"}
            onChange={(brand) => {
              setBrandFilter(brand === "all" ? null : brand);
              setBrandSearchQuery("");
            }}
            onSearchText={(text) => {
              setBrandFilter(null);
              setBrandSearchQuery(text);
            }}
            bodyTypes={brands}
            bodyTypeCounts={brandCounts}
          />
          <Button size="lg" variant="outline" className="h-11 shrink-0 gap-2 border-border/80 px-5" onClick={() => setFilterPanelOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" />
            {t("inventory.filter")}
          </Button>
          <Select value={visibleFilter} onValueChange={setVisibleFilter}>
            <SelectTrigger className="h-11 border-border/80 bg-background sm:w-[160px]">
              <SelectValue placeholder={t("admin.cars.filterVisible")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.cars.filterAll")}</SelectItem>
              <SelectItem value="visible">{t("admin.cars.visible")}</SelectItem>
              <SelectItem value="hidden">{t("admin.cars.hidden")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="border-t border-border/60 bg-muted/20 px-3 py-3.5 sm:px-4 sm:py-4">
          <CategoryFilter
            activeCategory={statusFilter}
            onCategoryChange={setStatusTab}
            counts={categoryCounts}
          />
        </div>
      </div>

      <InventoryToolbar
        totalCars={realCars.length}
        filteredCount={filteredCars.length}
        activeCategory={statusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        priceMin={filters.priceMin}
        priceMax={filters.priceMax}
        rangeMin={priceRange.min}
        rangeMax={priceRange.max}
        onPriceChange={(min, max) => setFilters((f) => ({ ...f, priceMin: min, priceMax: max }))}
      />

      {isLoading ? (
        <div className="py-8">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <SkeletonBlock key={idx} className="h-[320px] border border-border/40" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonBlock key={idx} className="h-[210px] border border-border/40" />
              ))}
            </div>
          )}
        </div>
      ) : realCars.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center text-muted-foreground">
          <Car className="mx-auto mb-4 h-12 w-12 opacity-40" />
          <p>{t("admin.cars.empty")}</p>
          <Button asChild className="mt-4 gap-1.5">
            <Link to="/admin/add-car">
              <Plus className="h-4 w-4" />
              {t("admin.cars.addFirst")}
            </Link>
          </Button>
        </div>
      ) : filteredCars.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-lg text-muted-foreground">{t("admin.cars.noResults")}</p>
          <Button variant="outline" className="mt-4 gap-1.5" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            {t("inventory.clearFilters")}
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCars.map((car, index) => (
            <div
              key={car.id}
              className={cn("relative animate-slide-up", !car.isActive && "opacity-75")}
              style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
            >
              {!car.isActive ? (
                <Badge variant="secondary" className="absolute left-4 top-4 z-20 shadow-sm">
                  {t("admin.cars.hidden")}
                </Badge>
              ) : null}
              <CarCard car={car} onEdit={handleEdit} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCars.map((car, index) => (
            <div
              key={car.id}
              className={cn("relative animate-slide-up", !car.isActive && "opacity-75")}
              style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
            >
              {!car.isActive ? (
                <Badge variant="secondary" className="absolute left-4 top-4 z-20 shadow-sm">
                  {t("admin.cars.hidden")}
                </Badge>
              ) : null}
              <CarListItem car={car} onEdit={handleEdit} />
            </div>
          ))}
        </div>
      )}

      <FilterPanel open={filterPanelOpen} onOpenChange={setFilterPanelOpen} filters={filters} onFiltersChange={setFilters} />
      <CarFormDialog open={formOpen} onOpenChange={handleFormClose} car={editingCar} />
    </div>
  );
};

export default AdminCars;
