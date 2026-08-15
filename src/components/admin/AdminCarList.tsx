import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCars } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Car, Loader2, Plus, X, ArrowRight } from "lucide-react";
import CarFormDialog from "@/components/admin/CarFormDialog";
import CarDetailDialog from "@/components/CarDetailDialog";
import type { Car as CarType } from "@/hooks/useCars";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const CAR_STATUSES = ["ready", "onroad", "luxury", "plate"] as const;

type MonthFilter = "all" | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11";

const FILTER_YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);

interface AdminCarListProps {
  /** Limit rows on dashboard preview; full list when omitted */
  previewLimit?: number;
  /** Read/write ?status= from URL (Cars page) */
  syncUrlStatus?: boolean;
}

const AdminCarList = ({ previewLimit, syncUrlStatus = false }: AdminCarListProps) => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: cars, isLoading: carsLoading } = useCars();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleFilter, setVisibleFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>("all");
  const [previewCar, setPreviewCar] = useState<CarType | null>(null);

  useEffect(() => {
    if (!syncUrlStatus) return;
    const status = searchParams.get("status");
    if (status && CAR_STATUSES.includes(status as (typeof CAR_STATUSES)[number])) {
      setStatusFilter(status);
    } else {
      setStatusFilter("all");
    }
  }, [searchParams, syncUrlStatus]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (!syncUrlStatus) return;
    if (value === "all") {
      searchParams.delete("status");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ status: value }, { replace: true });
    }
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      ready: "default",
      onroad: "secondary",
      luxury: "outline",
      plate: "destructive",
    };
    const key = `status.${status}` as TranslationKey;
    return <Badge variant={variants[status] || "default"}>{t(key)}</Badge>;
  };

  const realCars = useMemo(
    () => (cars ?? []).filter((c) => !String(c.id).startsWith("mock-")),
    [cars],
  );

  const monthOptions = useMemo(
    () => [
      { value: "all" as const, label: t("admin.reports.month.all") },
      { value: "0" as const, label: t("admin.reports.month.jan") },
      { value: "1" as const, label: t("admin.reports.month.feb") },
      { value: "2" as const, label: t("admin.reports.month.mar") },
      { value: "3" as const, label: t("admin.reports.month.apr") },
      { value: "4" as const, label: t("admin.reports.month.may") },
      { value: "5" as const, label: t("admin.reports.month.jun") },
      { value: "6" as const, label: t("admin.reports.month.jul") },
      { value: "7" as const, label: t("admin.reports.month.aug") },
      { value: "8" as const, label: t("admin.reports.month.sep") },
      { value: "9" as const, label: t("admin.reports.month.oct") },
      { value: "10" as const, label: t("admin.reports.month.nov") },
      { value: "11" as const, label: t("admin.reports.month.dec") },
    ],
    [t],
  );

  const carMatchesPeriod = (car: CarType) => {
    if (selectedYear === "all" && selectedMonth === "all") return true;
    if (!car.createdAt) return false;
    const d = new Date(car.createdAt);
    if (selectedYear !== "all" && d.getFullYear() !== selectedYear) return false;
    if (selectedMonth !== "all" && d.getMonth() !== Number(selectedMonth)) return false;
    return true;
  };

  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    return realCars.filter((car) => {
      if (!carMatchesPeriod(car)) return false;
      if (q) {
        const hay = `${car.name} ${car.code ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== "all" && car.status !== statusFilter) return false;
      if (visibleFilter === "visible" && !car.isActive) return false;
      if (visibleFilter === "hidden" && car.isActive) return false;
      return true;
    });
  }, [realCars, search, statusFilter, visibleFilter, selectedYear, selectedMonth]);

  const displayCars = previewLimit ? filteredCars.slice(0, previewLimit) : filteredCars;
  const hasMore = previewLimit != null && filteredCars.length > previewLimit;

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    visibleFilter !== "all" ||
    selectedYear !== "all" ||
    selectedMonth !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setVisibleFilter("all");
    setSelectedYear("all");
    setSelectedMonth("all");
    if (syncUrlStatus) setSearchParams({}, { replace: true });
  };

  const carImage = (car: CarType, className: string) => (
    <button
      type="button"
      onClick={() => setPreviewCar(car)}
      className={cn("cursor-pointer overflow-hidden rounded-lg border-0 bg-transparent p-0 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
      title={t("card.preview")}
    >
      <img src={car.image} alt={car.name} className="h-full w-full object-cover" />
    </button>
  );

  const carActions = (car: CarType) => (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        className="transition-transform active:scale-90"
        onClick={() => handleEdit(car)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <>
      <Card className="animate-admin-pop border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-[#174080]" />
              {previewLimit ? t("admin.cars.listPreview") : t("admin.cars.list")}
            </CardTitle>
            {realCars.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {filteredCars.length} {t("admin.common.results")}
              </p>
            ) : null}
          </div>
          {realCars.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              {previewLimit != null ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="car-preview-year">{t("admin.reports.year")}</Label>
                    <Select
                      value={String(selectedYear)}
                      onValueChange={(v) => setSelectedYear(v === "all" ? "all" : Number(v))}
                    >
                      <SelectTrigger id="car-preview-year" className="sm:w-[140px]">
                        <SelectValue placeholder={t("admin.reports.year")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.cars.filterAll")}</SelectItem>
                        {FILTER_YEARS.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="car-preview-month">{t("admin.reports.month")}</Label>
                    <Select
                      value={selectedMonth}
                      onValueChange={(v) => setSelectedMonth(v as MonthFilter)}
                    >
                      <SelectTrigger id="car-preview-month" className="sm:w-[160px]">
                        <SelectValue placeholder={t("admin.reports.month")} />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.cars.search")}
                className="sm:max-w-xs"
              />
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="sm:w-[160px]">
                  <SelectValue placeholder={t("admin.cars.filterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.cars.filterAll")}</SelectItem>
                  {CAR_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`status.${s}` as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          ) : null}
        </CardHeader>
        <CardContent>
          {carsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : realCars.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Car className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>{t("admin.cars.empty")}</p>
              <Button asChild className="mt-4 gap-1.5">
                <Link to="/admin/add-car">
                  <Plus className="h-4 w-4" />
                  {t("admin.cars.addFirst")}
                </Link>
              </Button>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>{t("admin.cars.noResults")}</p>
              <Button variant="outline" className="mt-4 gap-1.5" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                {t("admin.filter.clear")}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {displayCars.map((car, i) => (
                  <div
                    key={car.id}
                    className="flex gap-3 rounded-xl border border-border/70 p-3"
                    style={{
                      animation: "adminRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
                      animationDelay: `${Math.min(i, 12) * 0.03 + 0.25}s`,
                    }}
                  >
                    {carImage(car, "h-16 w-20 shrink-0")}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="font-medium leading-tight">{car.name}</div>
                      <div className="text-xs text-muted-foreground">{car.code}</div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold">${car.price.toLocaleString()}</span>
                        <span className="text-muted-foreground">{car.year}</span>
                        {getStatusBadge(car.status)}
                        <Badge variant={car.isActive ? "default" : "secondary"}>
                          {car.isActive ? t("admin.cars.visible") : t("admin.cars.hidden")}
                        </Badge>
                      </div>
                      <div className="pt-1">{carActions(car)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.cars.col.image")}</TableHead>
                      <TableHead>{t("admin.cars.col.name")}</TableHead>
                      <TableHead>{t("admin.cars.col.code")}</TableHead>
                      <TableHead>{t("admin.cars.col.year")}</TableHead>
                      <TableHead>{t("admin.cars.col.price")}</TableHead>
                      <TableHead>{t("admin.cars.col.status")}</TableHead>
                      <TableHead>{t("admin.cars.col.visible")}</TableHead>
                      <TableHead className="text-right">{t("admin.cars.col.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayCars.map((car, i) => (
                      <TableRow
                        key={car.id}
                        className="transition-colors hover:bg-muted/50"
                        style={{
                          animation: "adminRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
                          animationDelay: `${Math.min(i, 12) * 0.03 + 0.25}s`,
                        }}
                      >
                        <TableCell>
                          {carImage(car, "h-12 w-16 rounded transition-transform duration-300 hover:scale-105")}
                        </TableCell>
                        <TableCell className="font-medium">{car.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{car.code}</TableCell>
                        <TableCell>{car.year}</TableCell>
                        <TableCell>${car.price.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(car.status)}</TableCell>
                        <TableCell>
                          <Badge variant={car.isActive ? "default" : "secondary"}>
                            {car.isActive ? t("admin.cars.visible") : t("admin.cars.hidden")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{carActions(car)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {hasMore ? (
                <div className="mt-4 flex justify-center border-t border-border/60 pt-4">
                  <Button asChild variant="outline" className="gap-1.5">
                    <Link to="/admin/cars">
                      {t("admin.cars.viewAll")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <CarFormDialog open={formOpen} onOpenChange={handleFormClose} car={editingCar} />

      <CarDetailDialog
        car={previewCar}
        open={!!previewCar}
        onOpenChange={(open) => {
          if (!open) setPreviewCar(null);
        }}
      />
    </>
  );
};

export default AdminCarList;
