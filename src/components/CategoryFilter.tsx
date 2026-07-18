import { Button } from "@/components/ui/button";
import { CarStatus } from "@/hooks/useCars";

interface CategoryFilterProps {
  activeCategory: CarStatus | "all";
  onCategoryChange: (category: CarStatus | "all") => void;
}

const categories: { value: CarStatus | "all"; label: string }[] = [
  { value: "all", label: "ឡានទាំងអស់" },
  { value: "onroad", label: "ឡានលើផ្លូវ" },
  { value: "ready", label: "ឡានរួចរាល់" },
  { value: "luxury", label: "ឡានប្រណីត" },
  { value: "plate", label: "មានស្លាកលេខ" },
];

const CategoryFilter = ({ activeCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {categories.map((category) => (
        <Button
          key={category.value}
          variant="category"
          data-active={activeCategory === category.value}
          onClick={() => onCategoryChange(category.value)}
          className="transition-all duration-300"
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
