import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type OrderAlert = {
  carId: string;
  carName: string;
  carPrice: number;
  carImage?: string;
  orderedAt: string;
};

type OrderAlertContextValue = {
  alert: OrderAlert | null;
  showOrderAlert: (order: Omit<OrderAlert, "orderedAt">) => void;
  dismissOrderAlert: () => void;
};

const STORAGE_KEY = "carplus-order-alert-v1";

const OrderAlertContext = createContext<OrderAlertContextValue | null>(null);

const readStoredAlert = (): OrderAlert | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrderAlert;
    if (!parsed?.carName) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const OrderAlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<OrderAlert | null>(() => readStoredAlert());

  const showOrderAlert = useCallback((order: Omit<OrderAlert, "orderedAt">) => {
    const entry: OrderAlert = { ...order, orderedAt: new Date().toISOString() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    setAlert(entry);
  }, []);

  const dismissOrderAlert = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAlert(null);
  }, []);

  const value = useMemo(
    () => ({ alert, showOrderAlert, dismissOrderAlert }),
    [alert, showOrderAlert, dismissOrderAlert],
  );

  return <OrderAlertContext.Provider value={value}>{children}</OrderAlertContext.Provider>;
};

export const useOrderAlert = () => {
  const ctx = useContext(OrderAlertContext);
  if (!ctx) throw new Error("useOrderAlert must be used within OrderAlertProvider");
  return ctx;
};
