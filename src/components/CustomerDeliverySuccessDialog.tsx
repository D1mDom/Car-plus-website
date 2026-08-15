import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, FileText, Package, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";
import { OrderDeliveryDetailDialog } from "@/components/OrderDeliveryDetailDialog";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

const CustomerDeliverySuccessDialog = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { popupNotice, dismissPopup } = useCustomerNotifications();
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    setShowDetail(false);
  }, [popupNotice?.id]);

  const onAdmin = location.pathname.startsWith("/admin");
  if (!popupNotice || onAdmin) return null;

  const cancelled = popupNotice.status === "cancelled";
  const titleKey = `order.alert.status.${popupNotice.status}.title` as TranslationKey;
  const hintKey = `order.alert.status.${popupNotice.status}.hint` as TranslationKey;
  const title = t(titleKey);
  const hint = t(hintKey);

  const detail = {
    status: popupNotice.status,
    carName: popupNotice.carName,
    carPrice: popupNotice.carPrice,
    orderId: popupNotice.orderId,
    at: popupNotice.at,
  };

  if (showDetail) {
    return (
      <OrderDeliveryDetailDialog
        open
        onOpenChange={(open) => {
          if (!open) {
            setShowDetail(false);
            dismissPopup();
          }
        }}
        detail={detail}
        onViewOrders={() => {
          dismissPopup();
          navigate("/orders");
        }}
      />
    );
  }

  return (
    <Dialog
      open={!!popupNotice}
      onOpenChange={(open) => {
        if (!open) dismissPopup();
      }}
    >
      <DialogContent className="max-w-sm sm:rounded-2xl">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full",
              cancelled ? "bg-red-500/15 text-red-600" : "bg-emerald-500/15 text-emerald-600",
            )}
          >
            {cancelled ? <XCircle className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />}
          </span>
          <DialogHeader className="space-y-2 text-center sm:text-center">
            {!cancelled ? (
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                {t("order.alert.success")}
              </p>
            ) : null}
            <DialogTitle className="font-heading text-xl">
              {title === titleKey ? t("order.alert.title") : title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {hint === hintKey ? t("order.alert.hint") : hint}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium text-foreground">{popupNotice.carName}</p>
          <div className="flex w-full flex-col gap-2">
            <Button className="w-full gap-2 bg-[#174080] hover:bg-[#143871]" onClick={() => setShowDetail(true)}>
              <FileText className="h-4 w-4" />
              {t("order.detail.show")}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                dismissPopup();
                navigate("/orders");
              }}
            >
              <Package className="h-4 w-4" />
              {t("order.alert.viewOrders")}
            </Button>
            <Button variant="ghost" className="w-full" onClick={dismissPopup}>
              {t("order.alert.ok")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDeliverySuccessDialog;
