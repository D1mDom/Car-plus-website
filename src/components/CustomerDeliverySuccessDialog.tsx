import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, FileText, Package, XCircle } from "lucide-react";
import DigitalAlert from "@/components/DigitalAlert";
import { useLanguage } from "@/hooks/useLanguage";
import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";
import { OrderDeliveryDetailDialog } from "@/components/OrderDeliveryDetailDialog";
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
    <DigitalAlert
      open={!!popupNotice}
      onOpenChange={(open) => {
        if (!open) dismissPopup();
      }}
      tone={cancelled ? "danger" : "success"}
      eyebrow={cancelled ? undefined : t("order.alert.success")}
      title={title === titleKey ? t("order.alert.title") : title}
      description={hint === hintKey ? t("order.alert.hint") : hint}
      icon={cancelled ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
      primary={{
        label: t("order.detail.show"),
        icon: <FileText className="h-4 w-4" />,
        onClick: () => setShowDetail(true),
      }}
      secondary={{
        label: t("order.alert.viewOrders"),
        icon: <Package className="h-4 w-4" />,
        onClick: () => {
          dismissPopup();
          navigate("/orders");
        },
      }}
      dismissLabel={t("order.alert.ok")}
    >
      <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm font-medium text-foreground">
        {popupNotice.carName}
      </p>
    </DigitalAlert>
  );
};

export default CustomerDeliverySuccessDialog;
