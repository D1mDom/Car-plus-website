import { Clock, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/i18n/translations";

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
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-ocean/10 p-[10px] sm:p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{t("contact.hours")}</h3>
        </div>
        <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium ${
          isOpen
            ? "border border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
            : "border border-red-500/30 bg-red-500/10 text-red-500"
        }`}>
          {isOpen ? (
            <><CheckCircle className="h-4 w-4" /><span>{t("contact.open")}</span></>
          ) : (
            <><XCircle className="h-4 w-4" /><span>{t("contact.closed")}</span></>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {dayKeys.map((item, index) => {
          const isToday = index === dayIndex;
          return (
            <div
              key={item.short}
              className={`relative flex flex-col items-center rounded-xl p-2 transition-all duration-300 sm:p-3 ${
                isToday
                  ? "scale-105 bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${
                isToday ? "text-primary-foreground" : "text-muted-foreground"
              }`}>
                {t(item.short)}
              </span>
              <div className={`mt-2 text-center ${isToday ? "text-primary-foreground" : "text-foreground"}`}>
                <div className="text-[10px] font-medium sm:text-xs">{item.hours.split(" - ")[0]}</div>
                <div className="my-0.5 text-[9px] opacity-70 sm:text-[10px]">{t("contact.until")}</div>
                <div className="text-[10px] font-medium sm:text-xs">{item.hours.split(" - ")[1]}</div>
              </div>
              {isToday && (
                <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-background bg-green-500" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-border/50 pt-4">
        <p className="text-center text-sm text-muted-foreground">
          {t("contact.today")} ({t(dayKeys[dayIndex].full)}):{" "}
          <span className="font-semibold text-foreground">{dayKeys[dayIndex].hours}</span>
        </p>
      </div>
    </div>
  );
};

export default BusinessHours;
