import { LayoutGrid, List, ArrowUpDown, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CarStatus } from "@/hooks/useCars";

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
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-card rounded-xl border-2 border-border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {filteredCount} ក្នុង {totalCars} ឡាន
          </span>
        </div>
        {activeCategory !== "all" && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span className="capitalize">{activeCategory}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="តម្រៀប" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="newest">ថ្មីបំផុត</SelectItem>
            <SelectItem value="price-asc">តម្លៃ: ទាបទៅខ្ពស់</SelectItem>
            <SelectItem value="price-desc">តម្លៃ: ខ្ពស់ទៅទាប</SelectItem>
            <SelectItem value="year-desc">ឆ្នាំ: ថ្មីបំផុត</SelectItem>
            <SelectItem value="year-asc">ឆ្នាំ: ចាស់បំផុត</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center border-2 border-border rounded-lg overflow-hidden">
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
