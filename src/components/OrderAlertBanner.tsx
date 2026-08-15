import { Link } from "react-router-dom";
import { CheckCircle2, Truck, X } from "lucide-react";
import { useOrderAlert } from "@/hooks/useOrderAlert";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { CUSTOMER_NOTIFY_STATUSES } from "@/lib/orderFlow";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

const bannerTone = (status?: string) => {
  switch (status) {
    case "cancelled":
      return "border-red-700/20 from-red-600 to-red-700";
    case "confirmed":
    case "processing":
      return "border-[#174080]/20 from-[#174080] to-[#1a4a93]";
    default:
      return "border-emerald-700/20 from-emerald-600 to-emerald-700";
  }
};

const OrderAlertBanner = () => {
  const { alert, dismissOrderAlert } = useOrderAlert();
  const { t } = useLanguage();

  if (!alert) return null;

  const status = alert.status;
  const isDelivery = !!status && CUSTOMER_NOTIFY_STATUSES.has(status);
  const titleKey = `order.alert.status.${status}.title` as TranslationKey;
  const hintKey = `order.alert.status.${status}.hint` as TranslationKey;
  const title = isDelivery ? t(titleKey) : t("order.alert.title");
  const hint = isDelivery ? t(hintKey) : t("order.alert.hint");

  return (
    <div
      role="status"
      className={cn(
        "flex w-full items-center gap-3 border-b bg-gradient-to-r px-[10px] py-2.5 text-white sm:px-4",
        bannerTone(status)
      )}
    >
      {alert.carImage ? (
        <img
          src={alert.carImage}
          alt=""
          className="hidden h-10 w-14 shrink-0 rounded-md object-cover ring-1 ring-white/25 sm:block"
        />
      ) : isDelivery ? (
        <Truck className="h-5 w-5 shrink-0" aria-hidden />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">
          {title === titleKey ? t("order.alert.title") : title}
        </p>
        <p className="truncate text-xs opacity-95 sm:text-sm">
          {alert.carName}
          <span className="mx-1.5 opacity-60">·</span>
          ${alert.carPrice.toLocaleString()}
        </p>
        <p className="hidden text-xs opacity-90 sm:block">
          {hint === hintKey ? t("order.alert.hint") : hint}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="h-8 bg-white/15 text-white hover:bg-white/25 hover:text-white"
        >
          <Link to="/orders">{t("order.alert.viewOrders")}</Link>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
          onClick={dismissOrderAlert}
          aria-label={t("order.alert.dismiss")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OrderAlertBanner;
