import { CarStatus } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  activeCategory: CarStatus | "all";
  onCategoryChange: (category: CarStatus | "all") => void;
  counts?: Partial<Record<CarStatus | "all", number>>;
}

const categories: {
  value: CarStatus | "all";
  key: TranslationKey;
}[] = [
  { value: "all", key: "category.all" },
  { value: "onroad", key: "category.onroad" },
  { value: "ready", key: "category.ready" },
  { value: "luxury", key: "category.luxury" },
  { value: "plate", key: "category.plate" },
];

const CategoryFilter = ({ activeCategory, onCategoryChange, counts }: CategoryFilterProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t("category.label")}
      </p>

      <div className="-mx-0.5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map(({ value, key }) => {
          const isActive = activeCategory === value;
          const count = counts?.[value];

          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onCategoryChange(value)}
              className={cn(
                "group inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174080]/40 focus-visible:ring-offset-2",
                isActive
                  ? "border-[#174080] bg-[#174080] text-white shadow-sm shadow-[#174080]/25"
                  : "border-border/80 bg-background text-foreground hover:border-[#174080]/35 hover:bg-[#174080]/[0.05]",
              )}
            >
              <span className="whitespace-nowrap">{t(key)}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    "min-w-[1.35rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums leading-none",
                    isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;
