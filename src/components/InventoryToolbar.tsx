import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, ArrowUpDown, Car, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CarStatus } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

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
  priceMin: number;
  priceMax: number;
  rangeMin: number;
  rangeMax: number;
  onPriceChange: (min: number, max: number) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);

const PRICE_BUCKETS = [10000, 20000, 30000, 50000, 80000];

const parseAmount = (raw: string) => {
  const cleaned = raw.trim().toLowerCase().replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const k = cleaned.endsWith("k");
  const n = Number(k ? cleaned.slice(0, -1) : cleaned);
  if (!Number.isFinite(n)) return null;
  return k ? n * 1000 : n;
};

/** Parse "15000", "15k", "10000-20000", or "10000 to 20000". */
const parsePriceSearch = (raw: string) => {
  const text = raw.trim().toLowerCase().replace(/[$,]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return { type: "empty" as const };

  const range = text.match(/^(\d+(?:\.\d+)?k?)\s*(?:-|–|to|~)\s*(\d+(?:\.\d+)?k?)$/i);
  if (range) {
    const min = parseAmount(range[1]);
    const max = parseAmount(range[2]);
    if (min == null || max == null) return { type: "invalid" as const };
    return { type: "range" as const, min: Math.min(min, max), max: Math.max(min, max) };
  }

  const amount = parseAmount(text);
  if (amount == null) return { type: "invalid" as const };
  return { type: "amount" as const, amount };
};

const InventoryToolbar = ({
  totalCars,
  filteredCount,
  activeCategory,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  priceMin,
  priceMax,
  rangeMin,
  rangeMax,
  onPriceChange,
}: InventoryToolbarProps) => {
  const { t } = useLanguage();
  const isPriceActive = priceMin > rangeMin || priceMax < rangeMax;
  const span = Math.max(rangeMax - rangeMin, 1);
  const step = span > 50000 ? 1000 : span > 10000 ? 500 : span > 2000 ? 100 : 50;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (editing) return;
    setQuery(isPriceActive ? `${priceMin} - ${priceMax}` : "");
  }, [editing, isPriceActive, priceMin, priceMax]);

  const presets = useMemo(() => {
    const items: { key: string; label: string; min: number; max: number }[] = [
      { key: "all", label: t("inventory.priceAll"), min: rangeMin, max: rangeMax },
    ];

    for (const cap of PRICE_BUCKETS) {
      if (cap <= rangeMin || cap >= rangeMax) continue;
      items.push({
        key: `under-${cap}`,
        label: t("inventory.priceUnder", { price: formatPrice(cap) }),
        min: rangeMin,
        max: cap,
      });
    }

    const mid = PRICE_BUCKETS.find((cap) => cap > rangeMin && cap < rangeMax);
    if (mid && mid < rangeMax) {
      items.push({
        key: `plus-${mid}`,
        label: t("inventory.pricePlus", { price: formatPrice(mid) }),
        min: mid,
        max: rangeMax,
      });
    }

    return items;
  }, [rangeMin, rangeMax, t]);

  const clampPrice = (min: number, max: number) => {
    const nextMin = Math.min(Math.max(Math.round(min), rangeMin), rangeMax);
    const nextMax = Math.max(Math.min(Math.round(max), rangeMax), nextMin);
    onPriceChange(nextMin, nextMax);
  };

  const applySearch = (raw: string, { commit = false } = {}) => {
    const parsed = parsePriceSearch(raw);
    if (parsed.type === "empty") {
      onPriceChange(rangeMin, rangeMax);
      return;
    }
    if (parsed.type === "invalid") return;
    if (parsed.type === "range") {
      clampPrice(parsed.min, parsed.max);
      return;
    }
    // Ignore 1–2 digits while typing ("1", "15") so the list does not jump.
    if (!commit && parsed.amount < 100 && !/k$/i.test(raw.trim())) return;
    const amount = parsed.amount;
    const nearby = Math.max(500, Math.round(amount * 0.05));
    clampPrice(amount - nearby, amount + nearby);
  };

  const parseMoney = (raw: string, fallback: number) => {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  };

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

      <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:flex-nowrap">
        <Popover open={open} onOpenChange={setOpen}>
          <div
            data-price-search=""
            className={cn(
              "flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-md border bg-background sm:w-[220px] sm:flex-none",
              isPriceActive ? "border-primary" : "border-input",
            )}
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                aria-label={t("inventory.priceFilter")}
                placeholder={t("inventory.priceSearch")}
                value={query}
                onFocus={() => {
                  setEditing(true);
                  setOpen(true);
                }}
                onBlur={() => {
                  setEditing(false);
                  applySearch(query, { commit: true });
                }}
                onChange={(e) => {
                  const next = e.target.value;
                  setQuery(next);
                  setOpen(true);
                  applySearch(next);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applySearch(query, { commit: true });
                    setOpen(false);
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key === "Escape") {
                    setQuery("");
                    onPriceChange(rangeMin, rangeMax);
                    setOpen(false);
                  }
                }}
                className="h-10 w-full bg-transparent pl-8 pr-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-10 w-9 shrink-0 items-center justify-center border-l text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  isPriceActive ? "border-primary/40 text-primary" : "border-input",
                )}
                aria-label={t("inventory.priceFilter")}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </PopoverTrigger>
          </div>
          <PopoverContent
            align="end"
            className="w-[min(100vw-2rem,20rem)] space-y-4 p-4"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement | null;
              if (target?.closest("[data-price-search]")) e.preventDefault();
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{t("inventory.priceRange")}</p>
              {isPriceActive && (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={() => {
                    setQuery("");
                    onPriceChange(rangeMin, rangeMax);
                  }}
                >
                  {t("inventory.priceReset")}
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">{t("inventory.priceSearchHint")}</p>

            <p className="text-sm font-medium text-primary">
              {formatPrice(priceMin)} – {formatPrice(priceMax)}
            </p>

            <Slider
              min={rangeMin}
              max={rangeMax}
              step={step}
              value={[priceMin, priceMax]}
              onValueChange={([min, max]) => clampPrice(min, max)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatPrice(rangeMin)}</span>
              <span>{formatPrice(rangeMax)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("inventory.priceMin")}</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="h-9 text-sm"
                  value={priceMin}
                  onChange={(e) => clampPrice(parseMoney(e.target.value, priceMin), priceMax)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("inventory.priceMax")}</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="h-9 text-sm"
                  value={priceMax}
                  onChange={(e) => clampPrice(priceMin, parseMoney(e.target.value, priceMax))}
                />
              </div>
            </div>

            {presets.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => {
                  const active = priceMin === preset.min && priceMax === preset.max;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        setQuery(preset.key === "all" ? "" : `${preset.min} - ${preset.max}`);
                        onPriceChange(preset.min, preset.max);
                      }}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}
          </PopoverContent>
        </Popover>

        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger className="w-full min-w-0 flex-1 bg-background sm:w-[180px] sm:flex-none">
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
