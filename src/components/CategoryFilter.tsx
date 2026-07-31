import { Button } from "@/components/ui/button";
import { CarStatus } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/i18n/translations";

interface CategoryFilterProps {
  activeCategory: CarStatus | "all";
  onCategoryChange: (category: CarStatus | "all") => void;
}

const categories: { value: CarStatus | "all"; key: TranslationKey }[] = [
  { value: "all", key: "category.all" },
  { value: "onroad", key: "category.onroad" },
  { value: "ready", key: "category.ready" },
  { value: "luxury", key: "category.luxury" },
  { value: "plate", key: "category.plate" },
];

const CategoryFilter = ({ activeCategory, onCategoryChange }: CategoryFilterProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap justify-start gap-2">
      {categories.map((category) => (
        <Button
          key={category.value}
          variant="category"
          size="sm"
          data-active={activeCategory === category.value}
          onClick={() => onCategoryChange(category.value)}
          className="rounded-xl px-3.5 text-[13px] transition-all duration-200"
        >
          {t(category.key)}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
