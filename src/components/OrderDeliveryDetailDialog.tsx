import { CheckCircle2, Home, Package, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { digitalAlertContentClass } from "@/components/DigitalAlert";
import type { TranslationKey } from "@/i18n/translations";

export type DeliveryDetailInfo = {
  status: string;
  carName: string;
  carPrice: number;
  orderId?: string;
  at?: string;
};

const STATUSES = new Set([
  "pending",
  "confirmed",
  "processing",
  "delivered",
  "completed",
  "cancelled",
]);

const copyStatus = (status: string) => (STATUSES.has(status) ? status : "confirmed");

export const OrderDeliveryDetailDialog = ({
  open,
  onOpenChange,
  detail,
  onViewOrders,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: DeliveryDetailInfo | null;
  onViewOrders?: () => void;
}) => {
  const { t, lang } = useLanguage();

  if (!detail) return null;

  const status = copyStatus(detail.status);
  const cancelled = status === "cancelled";
  const delivered = status === "delivered" || status === "completed";
  const headlineKey = `order.detail.${status}.headline` as TranslationKey;
  const p1Key = `order.detail.${status}.p1` as TranslationKey;
  const p2Key = `order.detail.${status}.p2` as TranslationKey;
  const p3Key = `order.detail.${status}.p3` as TranslationKey;
  const headline = t(headlineKey);
  const p1 = t(p1Key);
  const p2 = t(p2Key);
  const p3 = t(p3Key);
  const dateLocale = lang === "km" ? "km-KH" : "en-GB";

  const money = (n: number) => `$${Number(n).toLocaleString()}`;
  const when = detail.at
    ? new Date(detail.at).toLocaleString(dateLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(digitalAlertContentClass, "max-h-[90vh] max-w-md overflow-y-auto p-5")}>
        <div className="flex flex-col items-center gap-3 py-1 text-center">
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full",
              cancelled ? "bg-red-500/15 text-red-600" : "bg-emerald-500/15 text-emerald-600",
            )}
          >
            {cancelled ? (
              <XCircle className="h-7 w-7" />
            ) : delivered ? (
              <Home className="h-7 w-7" />
            ) : (
              <CheckCircle2 className="h-7 w-7" />
            )}
          </span>
          <DialogHeader className="space-y-2 text-center sm:text-center">
            {!cancelled ? (
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                {t("order.alert.success")}
              </p>
            ) : null}
            <DialogTitle className="font-heading text-xl leading-snug">
              {headline === headlineKey ? t("order.alert.title") : headline}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>{p1 === p1Key ? t("order.alert.hint") : p1}</p>
                {p2 !== p2Key ? <p>{p2}</p> : null}
                {p3 !== p3Key ? <p>{p3}</p> : null}
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-left text-sm">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("order.detail.title")}
          </p>
          <dl className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">{t("order.detail.car")}</dt>
              <dd className="max-w-[60%] text-right font-medium text-foreground">{detail.carName}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">{t("order.detail.price")}</dt>
              <dd className="font-bold text-[#174080]">{money(detail.carPrice)}</dd>
            </div>
            {detail.orderId ? (
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">{t("order.detail.order")}</dt>
                <dd className="font-medium text-foreground">#{detail.orderId.slice(0, 8)}</dd>
              </div>
            ) : null}
            {when ? (
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">{t("order.detail.date")}</dt>
                <dd className="text-right text-foreground">{when}</dd>
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">{t("order.detail.status")}</dt>
              <dd className="font-medium text-foreground">
                {t(`orders.status.${status}` as TranslationKey)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-2">
          {onViewOrders ? (
            <Button className="w-full gap-2 bg-[#174080] hover:bg-[#143871]" onClick={onViewOrders}>
              <Package className="h-4 w-4" />
              {t("order.alert.viewOrders")}
            </Button>
          ) : null}
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            {t("order.alert.ok")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
