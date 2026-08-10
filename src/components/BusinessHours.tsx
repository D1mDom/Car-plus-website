import { Clock, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const dayKeys: { short: TranslationKey; full: TranslationKey; hours: string }[] = [
  { short: "day.mon", full: "day.monFull", hours: "8:00 - 20:00" },
  { short: "day.tue", full: "day.tueFull", hours: "8:00 - 20:00" },
  { short: "day.wed", full: "day.wedFull", hours: "8:00 - 20:00" },
  { short: "day.thu", full: "day.thuFull", hours: "8:00 - 20:00" },
  { short: "day.fri", full: "day.friFull", hours: "8:00 - 20:00" },
  { short: "day.sat", full: "day.satFull", hours: "8:00 - 18:00" },
  { short: "day.sun", full: "day.sunFull", hours: "8:00 - 18:00" },
];

const isCurrentlyOpen = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  if (day === 0 || day === 6) return hour >= 8 && hour < 18;
  return hour >= 8 && hour < 20;
};

const BusinessHours = () => {
  const { t } = useLanguage();
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;
  const isOpen = isCurrentlyOpen();

  return (
    <div className="h-full rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {t("contact.hours")}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("contact.today")}: {t(dayKeys[dayIndex].full)}
            </p>
          </div>
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            isOpen
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          )}
        >
          {isOpen ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {isOpen ? t("contact.open") : t("contact.closed")}
        </div>
      </div>

      <ul className="space-y-1">
        {dayKeys.map((item, index) => {
          const isToday = index === dayIndex;
          return (
            <li
              key={item.short}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors",
                isToday ? "bg-primary text-primary-foreground" : "hover:bg-muted/70"
              )}
            >
              <span className={cn("font-medium", !isToday && "text-foreground")}>
                {t(item.full)}
              </span>
              <span className={cn("tabular-nums", isToday ? "font-semibold" : "text-muted-foreground")}>
                {item.hours}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BusinessHours;
