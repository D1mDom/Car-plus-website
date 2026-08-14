import { useNavigate } from "react-router-dom";
import { Bell, Package, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/useLanguage";
import {
  orderCarLabel,
  orderCustomerLabel,
  useAdminOrderNotifications,
} from "@/hooks/useAdminOrderNotifications";
import { cn } from "@/lib/utils";

const AdminOrderNotifications = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    unreadCount,
    pendingCount,
    recentPending,
    markAllSeen,
    isLoading,
  } = useAdminOrderNotifications();

  const money = (n: number) => `$${Number(n).toLocaleString()}`;

  const formatWhen = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) markAllSeen();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className={cn(
            "relative h-9 w-9 shrink-0 rounded-lg text-[hsl(var(--sidebar-foreground))]/80 transition-colors hover:bg-[#174080]/20 hover:text-white",
            unreadCount > 0 && "text-white",
          )}
          title={t("admin.orders.notify.title")}
          aria-label={t("admin.orders.notify.title")}
        >
          <Bell className={cn("h-[1.15rem] w-[1.15rem]", unreadCount > 0 && "animate-pulse")} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[hsl(var(--sidebar-background))]">
              {unreadCount > 9 ? "9+" : unreadCount}
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50" />
            </span>
          ) : pendingCount > 0 ? (
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[hsl(var(--sidebar-background))]" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[60] w-[min(calc(100vw-1.5rem),24rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xl"
      >
        <DropdownMenuLabel className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#174080]/5 to-transparent px-4 py-3.5 font-normal">
          <div>
            <p className="text-base font-semibold text-[#174080]">{t("admin.orders.notify.title")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("admin.orders.notify.subtitle")}</p>
          </div>
          {pendingCount > 0 ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {pendingCount} {t("admin.orders.statPending").toLowerCase()}
            </span>
          ) : null}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="m-0 bg-slate-100" />

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#174080]" />
          </div>
        ) : recentPending.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Package className="h-6 w-6 text-slate-400" />
            </span>
            <p className="text-sm font-medium text-foreground">{t("admin.orders.notify.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("admin.orders.notify.emptyHint")}</p>
          </div>
        ) : (
          <div className="max-h-[min(60vh,340px)] overflow-y-auto">
            {recentPending.map((order, index) => (
              <DropdownMenuItem
                key={order.id}
                className="cursor-pointer rounded-none px-0 py-0 focus:bg-slate-50"
                onSelect={() => navigate("/admin/orders")}
              >
                <div
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3.5",
                    index < recentPending.length - 1 && "border-b border-slate-100",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#174080]/10">
                    <Package className="h-4 w-4 text-[#174080]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold leading-tight text-foreground">
                        {orderCustomerLabel(order)}
                      </p>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{orderCarLabel(order)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#174080]">{money(order.total_amount)}</span>
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        {t("admin.orders.statPending")}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{formatWhen(order.created_at)}</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator className="m-0 bg-slate-100" />

        <DropdownMenuItem
          className="cursor-pointer rounded-none px-0 py-0 focus:bg-[#174080]/5"
          onSelect={() => navigate("/admin/orders")}
        >
          <div className="flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-[#174080]">
            <Package className="h-4 w-4" />
            {t("admin.orders.notify.viewAll")}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminOrderNotifications;
