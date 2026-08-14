import { Link } from "react-router-dom";
import { Bell, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import {
  orderCarLabel,
  orderCustomerLabel,
  useAdminOrderNotifications,
} from "@/hooks/useAdminOrderNotifications";

const AdminOrderAlertBanner = () => {
  const { t } = useLanguage();
  const { unreadOrders, unreadCount, markAllSeen } = useAdminOrderNotifications();

  if (unreadCount === 0) return null;

  const latest = unreadOrders[0];
  if (!latest) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-2xl border border-[#174080]/15 bg-gradient-to-r from-[#174080]/8 via-[#174080]/5 to-white px-4 py-3.5 shadow-sm sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#174080] text-white shadow-md">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#174080] sm:text-base">
            {t("admin.orders.notify.bannerTitle", { count: unreadCount })}
          </p>
          <p className="mt-0.5 truncate text-sm text-slate-600">
            {orderCustomerLabel(latest)} · {orderCarLabel(latest)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <Button
          asChild
          size="sm"
          className="h-9 gap-1.5 bg-[#174080] px-4 text-white hover:bg-[#174080]/90"
        >
          <Link to="/admin/orders">
            {t("admin.orders.notify.viewAll")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          onClick={markAllSeen}
          aria-label={t("admin.orders.notify.dismiss")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AdminOrderAlertBanner;
