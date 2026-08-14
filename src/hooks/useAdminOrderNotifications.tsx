import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAdminOrders, type Order } from "@/hooks/useAdminOrders";

const SEEN_KEY = "carplus-admin-orders-seen-v1";

const readLastSeen = (): string => {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "";
  } catch {
    return "";
  }
};

const initLastSeen = (): string => {
  const stored = readLastSeen();
  if (stored) return stored;
  const now = new Date().toISOString();
  try {
    localStorage.setItem(SEEN_KEY, now);
  } catch {
    /* ignore */
  }
  return now;
};

export const orderCustomerLabel = (order: Order) =>
  order.customer_name?.trim() ||
  order.notes?.split("\n")[0]?.trim() ||
  "Customer";

export const orderCarLabel = (order: Order) =>
  order.order_items?.map((i) => i.car_name || i.car_id).filter(Boolean).join(", ") ||
  order.notes ||
  "—";

type AdminOrderNotificationContextValue = {
  pendingOrders: Order[];
  unreadOrders: Order[];
  unreadCount: number;
  pendingCount: number;
  recentPending: Order[];
  markAllSeen: () => void;
  isLoading: boolean;
};

const AdminOrderNotificationContext = createContext<AdminOrderNotificationContextValue | null>(null);

export const AdminOrderNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { data: orders = [], isLoading } = useAdminOrders();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [lastSeenAt, setLastSeenAt] = useState(initLastSeen);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const initRef = useRef(false);

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "pending" && !String(o.id).startsWith("optimistic")),
    [orders],
  );

  const unreadOrders = useMemo(() => {
    const seenMs = new Date(lastSeenAt).getTime();
    return pendingOrders.filter((o) => new Date(o.created_at).getTime() > seenMs);
  }, [pendingOrders, lastSeenAt]);

  const markAllSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(SEEN_KEY, now);
    setLastSeenAt(now);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!initRef.current) {
      prevIdsRef.current = new Set(orders.map((o) => o.id));
      initRef.current = true;
      return;
    }

    for (const order of orders) {
      if (order.status !== "pending" || String(order.id).startsWith("optimistic")) continue;
      if (prevIdsRef.current.has(order.id)) continue;

      toast.success(t("admin.orders.notify.newTitle"), {
        description: `${orderCustomerLabel(order)} · ${orderCarLabel(order)}`,
        action: {
          label: t("admin.orders.notify.view"),
          onClick: () => navigate("/admin/orders"),
        },
        duration: 12_000,
      });
    }

    prevIdsRef.current = new Set(orders.map((o) => o.id));
  }, [orders, isLoading, navigate, t]);

  const value = useMemo(
    () => ({
      pendingOrders,
      unreadOrders,
      unreadCount: unreadOrders.length,
      pendingCount: pendingOrders.length,
      recentPending: pendingOrders.slice(0, 8),
      markAllSeen,
      isLoading,
    }),
    [pendingOrders, unreadOrders, markAllSeen, isLoading],
  );

  return (
    <AdminOrderNotificationContext.Provider value={value}>
      {children}
    </AdminOrderNotificationContext.Provider>
  );
};

export const useAdminOrderNotifications = () => {
  const ctx = useContext(AdminOrderNotificationContext);
  if (!ctx) {
    throw new Error("useAdminOrderNotifications must be used within AdminOrderNotificationProvider");
  }
  return ctx;
};
