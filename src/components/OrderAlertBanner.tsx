import { Link } from "react-router-dom";
import { CheckCircle2, X } from "lucide-react";
import { useOrderAlert } from "@/hooks/useOrderAlert";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

const OrderAlertBanner = () => {
  const { alert, dismissOrderAlert } = useOrderAlert();
  const { t } = useLanguage();

  if (!alert) return null;

  return (
    <div
      role="status"
      className="flex w-full items-center gap-3 border-b border-emerald-700/20 bg-gradient-to-r from-emerald-600 to-emerald-700 px-[10px] py-2.5 text-white sm:px-4"
    >
      {alert.carImage ? (
        <img
          src={alert.carImage}
          alt=""
          className="hidden h-10 w-14 shrink-0 rounded-md object-cover ring-1 ring-white/25 sm:block"
        />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{t("order.alert.title")}</p>
        <p className="truncate text-xs opacity-95 sm:text-sm">
          {alert.carName}
          <span className="mx-1.5 opacity-60">·</span>
          ${alert.carPrice.toLocaleString()}
        </p>
        <p className="hidden text-xs opacity-90 sm:block">{t("order.alert.hint")}</p>
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
