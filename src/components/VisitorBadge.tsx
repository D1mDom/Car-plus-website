import { Globe, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useVisitorCount } from "@/hooks/useVisitors";
import { cn } from "@/lib/utils";

const VisitorBadge = ({ className, live = false }: { className?: string; live?: boolean }) => {
  const { t } = useLanguage();
  const { data: count = 0, isLoading } = useVisitorCount(live ? 10_000 : 30_000);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-[#174080] px-3 py-1.5 text-xs font-medium text-white shadow-sm",
        className
      )}
      title={t("visitors.hint")}
    >
      <Globe className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
      <span className="hidden sm:inline">{t("visitors.label")}</span>
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin opacity-80" aria-label={t("visitors.loading")} />
      ) : (
        <span className="font-semibold tabular-nums">{count.toLocaleString()}</span>
      )}
    </div>
  );
};

export default VisitorBadge;
