import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCars, type Car as CarType } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, X, Car, LayoutGrid, Search } from "lucide-react";
import CarCard from "@/components/CarCard";
import CarFormDialog from "@/components/admin/CarFormDialog";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const CAR_STATUSES = ["ready", "onroad", "luxury", "plate"] as const;

const AdminCars = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: cars, isLoading } = useCars();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleFilter, setVisibleFilter] = useState("all");

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && CAR_STATUSES.includes(status as (typeof CAR_STATUSES)[number])) {
      setStatusFilter(status);
    } else {
      setStatusFilter("all");
    }
  }, [searchParams]);

  const setStatusTab = (value: string) => {
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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: realCars.length };
    for (const s of CAR_STATUSES) {
      counts[s] = realCars.filter((c) => c.status === s).length;
    }
    return counts;
  }, [realCars]);

  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    return realCars.filter((car) => {
      if (q) {
        const hay = `${car.name} ${car.code ?? ""} ${car.model ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== "all" && car.status !== statusFilter) return false;
      if (visibleFilter === "visible" && !car.isActive) return false;
      if (visibleFilter === "hidden" && car.isActive) return false;
      return true;
    });
  }, [realCars, search, statusFilter, visibleFilter]);

  const hasFilters = search.trim() !== "" || statusFilter !== "all" || visibleFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setVisibleFilter("all");
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#174080]/10 text-[#174080]">
            <LayoutGrid className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">{t("admin.cars.pageHint")}</p>
            {!isLoading && realCars.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("admin.cars.showing").replace("{count}", String(filteredCars.length))}
              </p>
            ) : null}
          </div>
        </div>
        <Button asChild className="shrink-0 gap-1.5">
          <Link to="/admin/add-car">
            <Plus className="h-4 w-4" />
            {t("admin.cars.add")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={statusFilter === "all" ? "default" : "outline"}
          onClick={() => setStatusTab("all")}
          className="gap-1.5 rounded-full"
        >
          {t("admin.cars.filterAll")}
          <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 justify-center px-1.5 text-[10px]">
            {statusCounts.all}
          </Badge>
        </Button>
        {CAR_STATUSES.map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusTab(s)}
            className="gap-1.5 rounded-full"
          >
            {t(`status.${s}` as TranslationKey)}
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 justify-center px-1.5 text-[10px]">
              {statusCounts[s] ?? 0}
            </Badge>
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.cars.search")}
            className="pl-9"
          />
        </div>
        <Select value={visibleFilter} onValueChange={setVisibleFilter}>
          <SelectTrigger className="sm:w-[160px]">
            <SelectValue placeholder={t("admin.cars.filterVisible")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.cars.filterAll")}</SelectItem>
            <SelectItem value="visible">{t("admin.cars.visible")}</SelectItem>
            <SelectItem value="hidden">{t("admin.cars.hidden")}</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
            <X className="h-3.5 w-3.5" />
            {t("admin.filter.clear")}
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : realCars.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
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
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <p>{t("admin.cars.noResults")}</p>
          <Button variant="outline" className="mt-4 gap-1.5" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            {t("admin.filter.clear")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredCars.map((car) => (
            <div key={car.id} className={cn("relative", !car.isActive && "opacity-75")}>
              {!car.isActive ? (
                <Badge
                  variant="secondary"
                  className="absolute left-4 top-4 z-20 shadow-sm"
                >
                  {t("admin.cars.hidden")}
                </Badge>
              ) : null}
              <CarCard car={car} onEdit={handleEdit} />
            </div>
          ))}
        </div>
      )}

      <CarFormDialog open={formOpen} onOpenChange={handleFormClose} car={editingCar} />
    </div>
  );
};

export default AdminCars;
