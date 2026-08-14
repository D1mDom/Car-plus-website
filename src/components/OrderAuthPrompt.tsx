import { useEffect, useState } from "react";
import { LogIn, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import type { Car } from "@/hooks/useCars";
import PlaceOrderDialog from "@/components/PlaceOrderDialog";
import AuthDialog from "@/components/AuthDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
      <AlertDialog
        open={permissionOpen}
        onOpenChange={(open) => {
          if (!open) closeAll();
        }}
      >
        <AlertDialogContent className="sm:max-w-md sm:rounded-2xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#174080]/10 text-[#174080]">
              <Shield className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-center">{t("order.permission.title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-center leading-relaxed">
              {t("order.permission.desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                openAuth();
              }}
              className="w-full gap-2"
            >
              <LogIn className="h-4 w-4" />
              {t("order.permission.signIn")}
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 w-full">{t("auth.cancel")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
