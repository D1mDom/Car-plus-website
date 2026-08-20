import { useEffect, useMemo, useState } from "react";
import { CarFront, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

interface BodyTypeSearchProps {
  value: string;
  onChange: (brand: string) => void;
  onSearchText: (query: string) => void;
  bodyTypes: string[];
  bodyTypeCounts?: Record<string, number>;
}

const BodyTypeSearch = ({ value, onChange, onSearchText, bodyTypes, bodyTypeCounts }: BodyTypeSearchProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const isActive = value !== "all";

  useEffect(() => {
    if (editing) return;
    setQuery(isActive ? value : "");
  }, [editing, isActive, value]);

  const options = useMemo(() => {
    const all = [
      { value: "all", label: t("category.brand.all"), count: bodyTypeCounts?.all },
      ...bodyTypes.map((brand) => ({
        value: brand,
        label: brand,
        count: bodyTypeCounts?.[brand],
      })),
    ];
    const needle = query.trim().toLowerCase();
    if (!needle || (!editing && isActive)) return all;
    return all.filter(
      (option) =>
        option.value.toLowerCase().includes(needle) || option.label.toLowerCase().includes(needle),
    );
  }, [bodyTypeCounts, bodyTypes, editing, isActive, query, t]);

  const selectType = (next: string) => {
    onSearchText("");
    onChange(next);
    setQuery(next === "all" ? "" : next);
    setEditing(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div data-body-type-search="" className="relative min-w-0 flex-1">
          <CarFront className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("category.brand.search")}
            value={query}
            aria-label={t("category.brand.label")}
            onFocus={() => {
              setEditing(true);
              setOpen(true);
              if (isActive) setQuery("");
            }}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              setOpen(true);
              if (!next.trim()) {
                onSearchText("");
                onChange("all");
                return;
              }
              onSearchText(next);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const exact = options.find(
                  (option) =>
                    option.value !== "all" &&
                    (option.value.toLowerCase() === query.trim().toLowerCase() ||
                      option.label.toLowerCase() === query.trim().toLowerCase()),
                );
                const firstType = options.find((option) => option.value !== "all");
                if (exact) selectType(exact.value);
                else if (firstType && options.filter((option) => option.value !== "all").length === 1) {
                  selectType(firstType.value);
                } else {
                  setOpen(false);
                }
              }
              if (e.key === "Escape") {
                selectType("all");
              }
            }}
            className={cn(
              "h-11 border-border/80 bg-background pl-11 pr-16",
              isActive && "border-primary",
            )}
          />
          {isActive && (
            <button
              type="button"
              className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              aria-label={t("inventory.clearFilters")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectType("all")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              aria-label={t("category.brand.label")}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popper-anchor-width)] min-w-[16rem] p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest("[data-body-type-search]")) e.preventDefault();
        }}
        onCloseAutoFocus={() => setEditing(false)}
      >
        {options.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">{t("inventory.empty")}</p>
        ) : (
          options.map((option) => {
            const active = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectType(option.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm",
                  active ? "bg-[#174080] text-white" : "text-foreground hover:bg-[#174080]/10",
                )}
              >
                <span>{option.label}</span>
                {option.count !== undefined && (
                  <span className={cn("tabular-nums text-xs", active ? "text-white/80" : "text-muted-foreground")}>
                    {option.count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </PopoverContent>
    </Popover>
  );
};

export default BodyTypeSearch;
