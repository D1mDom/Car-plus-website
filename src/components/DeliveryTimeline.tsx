import { Ban, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { DELIVERY_STEPS, deliveryStepIndex } from "@/lib/orderFlow";
import type { TranslationKey } from "@/i18n/translations";

const DeliveryTimeline = ({
  status,
  compact = false,
  legend = false,
  onDark = false,
}: {
  status: string;
  compact?: boolean;
  legend?: boolean;
  onDark?: boolean;
}) => {
  const { t } = useLanguage();

  if (!legend && status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
        <Ban className="h-3.5 w-3.5 shrink-0" />
        {t("orders.cancelledHint")}
      </div>
    );
  }

  const idx = legend ? -1 : deliveryStepIndex(status);
  const last = DELIVERY_STEPS.length - 1;

  return (
    <div>
      <div className="grid grid-cols-5">
        {DELIVERY_STEPS.map((step, i) => {
          const done = !legend && i < idx;
          const current = !legend && i === idx;
          return (
            <div key={step} className="min-w-0">
              <div className="flex items-center">
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    i === 0
                      ? "bg-transparent"
                      : done || current
                        ? "bg-[#174080]"
                        : onDark
                          ? "bg-white/25"
                          : "bg-border"
                  )}
                />
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    compact ? "h-5 w-5" : "h-6 w-6",
                    current
                      ? "bg-[#174080] text-white ring-4 ring-[#174080]/15"
                      : done
                        ? "bg-[#174080] text-white"
                        : onDark
                          ? "border border-white/30 bg-white/10 text-white"
                          : "border border-border bg-card text-muted-foreground"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                  ) : (
                    i + 1
                  )}
                </span>
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    i === last
                      ? "bg-transparent"
                      : done
                        ? "bg-[#174080]"
                        : onDark
                          ? "bg-white/25"
                          : "bg-border"
                  )}
                />
              </div>
              <p
                className={cn(
                  "mt-1.5 px-0.5 text-center font-semibold leading-tight",
                  compact ? "text-[9px]" : "text-[10px] sm:text-[11px]",
                  current
                    ? "text-[#174080]"
                    : onDark
                      ? "text-white/80"
                      : "text-muted-foreground"
                )}
              >
                {t(`orders.step.${step}` as TranslationKey)}
              </p>
            </div>
          );
        })}
      </div>
      {!compact && !legend && (
        <p className="mt-3 rounded-xl bg-[#174080]/6 px-3 py-2 text-center text-xs leading-relaxed text-[#143871] dark:text-sky-200">
          {t(`orders.stepHint.${status}` as TranslationKey)}
        </p>
      )}
    </div>
  );
};

export default DeliveryTimeline;
