import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, RotateCcw } from "lucide-react";
import { useCars } from "@/hooks/useCars";
import { useMemo } from "react";

export interface FilterState {
  yearMin: number | null;
  yearMax: number | null;
  fuelType: string | null;
  color: string | null;
  priceMin: number;
  priceMax: number;
}

interface FilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 100000;

export const defaultFilters: FilterState = {
  yearMin: null, yearMax: null, fuelType: null, color: null,
  priceMin: DEFAULT_MIN_PRICE, priceMax: DEFAULT_MAX_PRICE,
};

const FilterPanel = ({ open, onOpenChange, filters, onFiltersChange }: FilterPanelProps) => {
  const { data: carsData = [] } = useCars();

  const { years, fuelTypes, colors, minPrice, maxPrice } = useMemo(() => {
    if (carsData.length === 0) return { years: [], fuelTypes: [], colors: [], minPrice: DEFAULT_MIN_PRICE, maxPrice: DEFAULT_MAX_PRICE };
    return {
      years: [...new Set(carsData.map((car) => car.year))].sort((a, b) => b - a),
      fuelTypes: [...new Set(carsData.map((car) => car.fuelType))],
      colors: [...new Set(carsData.map((car) => car.color))],
      minPrice: Math.min(...carsData.map((car) => car.price)),
      maxPrice: Math.max(...carsData.map((car) => car.price)),
    };
  }, [carsData]);

  const handleReset = () => { onFiltersChange({ ...defaultFilters, priceMin: minPrice, priceMax: maxPrice }); };

  const formatPrice = (price: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);

  const hasActiveFilters = filters.yearMin !== null || filters.yearMax !== null || filters.fuelType !== null || filters.color !== null || filters.priceMin !== minPrice || filters.priceMax !== maxPrice;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border">
        <SheetHeader className="pb-6 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">តម្រងកម្រិតខ្ពស់</SheetTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground gap-2">
                <RotateCcw className="h-4 w-4" />
                កំណត់ឡើងវិញ
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-8 py-6">
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">ជួរឆ្នាំ</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">ពី</Label>
                <Select value={filters.yearMin?.toString() || ""} onValueChange={(value) => onFiltersChange({ ...filters, yearMin: value ? parseInt(value) : null })}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="ណាមួយ" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="any">ណាមួយ</SelectItem>
                    {years.map((year) => (<SelectItem key={year} value={year.toString()}>{year}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">ដល់</Label>
                <Select value={filters.yearMax?.toString() || ""} onValueChange={(value) => onFiltersChange({ ...filters, yearMax: value ? parseInt(value) : null })}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="ណាមួយ" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="any">ណាមួយ</SelectItem>
                    {years.map((year) => (<SelectItem key={year} value={year.toString()}>{year}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">ប្រភេទប្រេង</Label>
            <Select value={filters.fuelType || ""} onValueChange={(value) => onFiltersChange({ ...filters, fuelType: value === "any" ? null : value })}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="ប្រភេទប្រេងណាមួយ" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="any">ប្រភេទប្រេងណាមួយ</SelectItem>
                {fuelTypes.map((fuel) => (<SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">ពណ៌</Label>
            <Select value={filters.color || ""} onValueChange={(value) => onFiltersChange({ ...filters, color: value === "any" ? null : value })}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="ពណ៌ណាមួយ" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="any">ពណ៌ណាមួយ</SelectItem>
                {colors.map((color) => (
                  <SelectItem key={color} value={color}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: color.toLowerCase() === "white" ? "#ffffff" : color.toLowerCase() === "black" ? "#1a1a1a" : color.toLowerCase() === "silver" ? "#c0c0c0" : color.toLowerCase() === "blue" ? "#3b82f6" : color.toLowerCase() === "red" ? "#ef4444" : "#9ca3af" }} />
                      {color}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">ជួរតម្លៃ</Label>
              <span className="text-sm text-primary font-medium">{formatPrice(filters.priceMin)} - {formatPrice(filters.priceMax)}</span>
            </div>
            <div className="pt-2">
              <Slider min={minPrice} max={maxPrice} step={1000} value={[filters.priceMin, filters.priceMax]} onValueChange={([min, max]) => onFiltersChange({ ...filters, priceMin: min, priceMax: max })} className="w-full" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{formatPrice(minPrice)}</span>
                <span>{formatPrice(maxPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
            អនុវត្តតម្រង
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterPanel;
