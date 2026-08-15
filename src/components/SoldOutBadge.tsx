import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const SoldOutBadge = ({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) => {
  const { t } = useLanguage();

  return (
    <span
      className={cn(
        "pointer-events-none z-20 inline-flex items-center justify-center rounded-md border-2 border-white bg-red-600 font-black uppercase tracking-widest text-white shadow-lg",
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-sm sm:text-base",
        className,
      )}
    >
      {t("card.soldOut")}
    </span>
  );
};

export default SoldOutBadge;
