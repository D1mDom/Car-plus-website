import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, FileText, Package, Truck } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { useCustomerNotifications, type CustomerNotice } from "@/hooks/useCustomerNotifications";
import { OrderDeliveryDetailDialog } from "@/components/OrderDeliveryDetailDialog";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

const CustomerNotifications = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { notices, unreadCount, markAllRead } = useCustomerNotifications();
  const [selected, setSelected] = useState<CustomerNotice | null>(null);

  if (!user) return null;

  const money = (n: number) => `$${Number(n).toLocaleString()}`;

  const formatWhen = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unreadCount > 0) markAllRead();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 text-[hsl(244_30%_40%)] hover:bg-[#174080]/12 hover:text-[#174080]",
            unreadCount > 0 && "text-[#174080]",
          )}
          title={t("order.notify.title")}
          aria-label={t("order.notify.title")}
        >
          <Bell className={cn("h-[18px] w-[18px]", unreadCount > 0 && "animate-pulse")} />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50" />
            </span>
          ) : notices.length > 0 ? (
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#174080] ring-2 ring-white" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[60] w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xl"
      >
        <DropdownMenuLabel className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#174080]/6 to-transparent px-4 py-3.5 font-normal">
          <div>
            <p className="text-base font-semibold text-[#174080]">{t("order.notify.title")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("order.notify.subtitle")}</p>
          </div>
          {unreadCount > 0 ? (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
              {unreadCount}
            </span>
          ) : null}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="m-0 bg-slate-100" />

        {notices.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Bell className="h-5 w-5 text-slate-400" />
            </span>
            <p className="text-sm font-medium text-foreground">{t("order.notify.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("order.notify.emptyHint")}</p>
          </div>
        ) : (
          <div className="max-h-[min(60vh,340px)] overflow-y-auto">
            {notices.map((notice, index) => {
              const titleKey = `order.alert.status.${notice.status}.title` as TranslationKey;
              const hintKey = `order.alert.status.${notice.status}.hint` as TranslationKey;
              const title = t(titleKey);
              const hint = t(hintKey);
              return (
                <DropdownMenuItem
                  key={notice.id}
                  className="cursor-pointer rounded-none px-0 py-0 focus:bg-slate-50"
                  onSelect={() => setSelected(notice)}
                >
                  <div
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3.5",
                      index < notices.length - 1 && "border-b border-slate-100",
                      !notice.read && "bg-[#174080]/4",
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#174080]/10 text-[#174080]">
                      {notice.status === "delivered" || notice.status === "completed" ? (
                        <Package className="h-4 w-4" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-tight text-foreground">
                        {title === titleKey ? t("order.alert.title") : title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {hint === hintKey ? notice.carName : hint}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{notice.carName}</span>
                        <span className="text-sm font-bold text-[#174080]">{money(notice.carPrice)}</span>
                        <span className="text-[11px] text-muted-foreground">{formatWhen(notice.at)}</span>
                      </div>
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#174080]">
                        <FileText className="h-3 w-3" />
                        {t("order.detail.show")}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}

        <DropdownMenuSeparator className="m-0 bg-slate-100" />

        <DropdownMenuItem
          className="cursor-pointer rounded-none px-0 py-0 focus:bg-[#174080]/5"
          onSelect={() => navigate("/orders")}
        >
          <div className="flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-[#174080]">
            <Package className="h-4 w-4" />
            {t("order.notify.viewAll")}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <OrderDeliveryDetailDialog
      open={!!selected}
      onOpenChange={(open) => {
        if (!open) setSelected(null);
      }}
      detail={
        selected
          ? {
              status: selected.status,
              carName: selected.carName,
              carPrice: selected.carPrice,
              orderId: selected.orderId,
              at: selected.at,
            }
          : null
      }
      onViewOrders={() => {
        setSelected(null);
        navigate("/orders");
      }}
    />
    </>
  );
};

export default CustomerNotifications;
