import { LayoutGrid, List, ArrowUpDown, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CarStatus } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";

export type SortOption = "newest" | "price-asc" | "price-desc" | "year-desc" | "year-asc";
export type ViewMode = "grid" | "list";

interface InventoryToolbarProps {
  totalCars: number;
  filteredCount: number;
  activeCategory: CarStatus | "all";
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const InventoryToolbar = ({ totalCars, filteredCount, activeCategory, sortBy, onSortChange, viewMode, onViewModeChange }: InventoryToolbarProps) => {
  const { t } = useLanguage();

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-[10px] sm:flex-row sm:items-center sm:p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {t("inventory.count", { filtered: filteredCount, total: totalCars })}
          </span>
        </div>
        {activeCategory !== "all" && (
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            <span className="capitalize">{t(`status.${activeCategory}` as "status.ready")}</span>
          </div>
        )}
      </div>

      <div className="flex w-full items-center gap-3 sm:w-auto">
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger className="w-full bg-background sm:w-[200px]">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t("inventory.sort")} />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            <SelectItem value="newest">{t("inventory.sort.newest")}</SelectItem>
            <SelectItem value="price-asc">{t("inventory.sort.priceAsc")}</SelectItem>
            <SelectItem value="price-desc">{t("inventory.sort.priceDesc")}</SelectItem>
            <SelectItem value="year-desc">{t("inventory.sort.yearDesc")}</SelectItem>
            <SelectItem value="year-asc">{t("inventory.sort.yearAsc")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center overflow-hidden rounded-lg border border-border">
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => onViewModeChange("grid")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => onViewModeChange("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InventoryToolbar;
