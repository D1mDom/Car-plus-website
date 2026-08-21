import { useEffect, useState } from "react";
import { LogIn, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import type { Car } from "@/hooks/useCars";
import PlaceOrderDialog from "@/components/PlaceOrderDialog";
import AuthDialog from "@/components/AuthDialog";
import DigitalAlert from "@/components/DigitalAlert";

interface OrderAuthPromptProps {
  car: Car | null;
  onOpenChange: (open: boolean) => void;
}

const OrderAuthPrompt = ({ car, onOpenChange }: OrderAuthPromptProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    if (!car) {
      setPermissionOpen(false);
      setAuthOpen(false);
      setOrderOpen(false);
      return;
    }
    if (user) {
      setPermissionOpen(false);
      setAuthOpen(false);
      setOrderOpen(true);
    } else {
      setPermissionOpen(true);
      setAuthOpen(false);
      setOrderOpen(false);
    }
  }, [car, user]);

  const closeAll = () => {
    setPermissionOpen(false);
    setAuthOpen(false);
    setOrderOpen(false);
    onOpenChange(false);
  };

  const openAuth = () => {
    setPermissionOpen(false);
    setAuthOpen(true);
  };

  const handleAuthClose = (open: boolean) => {
    setAuthOpen(open);
    if (!open && !user) closeAll();
  };

  const handleAuthSuccess = () => {
    setAuthOpen(false);
    if (car) setOrderOpen(true);
  };

  return (
    <>
      <DigitalAlert
        open={permissionOpen}
        onOpenChange={(open) => {
          if (!open) closeAll();
        }}
        tone="brand"
        eyebrow={t("alert.loginRequired")}
        title={t("order.permission.title")}
        description={t("order.permission.desc")}
        icon={<Shield className="h-5 w-5" />}
        primary={{
          label: t("order.permission.signIn"),
          icon: <LogIn className="h-4 w-4" />,
          onClick: openAuth,
        }}
        dismissLabel={t("auth.cancel")}
      />

      <AuthDialog
        open={authOpen}
        onOpenChange={handleAuthClose}
        onLoginSuccess={handleAuthSuccess}
        onSignupSuccess={handleAuthSuccess}
      />

      <PlaceOrderDialog
        car={orderOpen ? car : null}
        onOpenChange={(open) => {
          if (!open) closeAll();
        }}
      />
    </>
  );
};

export default OrderAuthPrompt;
