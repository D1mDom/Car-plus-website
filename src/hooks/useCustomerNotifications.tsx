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
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useMyOrders, parseOrderNotes, type MyOrder } from "@/hooks/useMyOrders";
import { useOrderAlert } from "@/hooks/useOrderAlert";
import { CUSTOMER_NOTIFY_STATUSES } from "@/lib/orderFlow";
import type { TranslationKey } from "@/i18n/translations";

export type CustomerNotice = {
  id: string;
  orderId: string;
  carName: string;
  carPrice: number;
  status: string;
  at: string;
  read: boolean;
};

type CustomerNotificationContextValue = {
  notices: CustomerNotice[];
  unreadCount: number;
  popupNotice: CustomerNotice | null;
  markAllRead: () => void;
  dismissPopup: () => void;
  isLoading: boolean;
};

const SEEN_KEY = "carplus-order-status-seen-v1";
const NOTICE_KEY = "carplus-customer-notices-v1";

const CustomerNotificationContext = createContext<CustomerNotificationContextValue | null>(null);

const carLabel = (order: MyOrder) =>
  order.order_items?.map((i) => i.car_name).filter(Boolean).join(", ")
  || parseOrderNotes(order.notes).carName
  || "Car";

const seenStorageKey = (userId: string) => `${SEEN_KEY}:${userId}`;
const noticeStorageKey = (userId: string) => `${NOTICE_KEY}:${userId}`;

const readSeen = (userId: string): Record<string, string> => {
  try {
    const raw = localStorage.getItem(seenStorageKey(userId)) ?? localStorage.getItem(SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeSeen = (userId: string, map: Record<string, string>) => {
  try {
    localStorage.setItem(seenStorageKey(userId), JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

const readNotices = (userId: string): CustomerNotice[] => {
  try {
    const raw = localStorage.getItem(noticeStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomerNotice[];
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
};

const writeNotices = (userId: string, items: CustomerNotice[]) => {
  try {
    localStorage.setItem(noticeStorageKey(userId), JSON.stringify(items.slice(0, 20)));
  } catch {
    /* ignore */
  }
};

const snapshot = (orders: MyOrder[]) =>
  Object.fromEntries(orders.map((o) => [o.id, o.status]));

export const CustomerNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useMyOrders();
  const { showOrderAlert } = useOrderAlert();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const readyRef = useRef(false);
  const userId = user?.id ?? "";
  const [notices, setNotices] = useState<CustomerNotice[]>([]);
  const [popupNotice, setPopupNotice] = useState<CustomerNotice | null>(null);

  useEffect(() => {
    readyRef.current = false;
    setNotices(userId ? readNotices(userId) : []);
    setPopupNotice(null);
  }, [userId]);

  const persist = useCallback(
    (updater: (prev: CustomerNotice[]) => CustomerNotice[]) => {
      if (!userId) return;
      setNotices((prev) => {
        const trimmed = updater(prev).slice(0, 20);
        writeNotices(userId, trimmed);
        return trimmed;
      });
    },
    [userId],
  );

  const markAllRead = useCallback(() => {
    persist((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
  }, [persist]);

  const dismissPopup = useCallback(() => setPopupNotice(null), []);

  useEffect(() => {
    if (!userId || isLoading) return;

    const current = snapshot(orders);
    const seen = readSeen(userId);
    const hasHistory = Object.keys(seen).length > 0;

    if (!readyRef.current) {
      readyRef.current = true;
      if (!hasHistory) {
        writeSeen(userId, current);
        return;
      }
    }

    const incoming: CustomerNotice[] = [];

    for (const order of orders) {
      const prev = seen[order.id];
      if (!prev || prev === order.status) continue;
      if (!CUSTOMER_NOTIFY_STATUSES.has(order.status)) continue;

      const titleKey = `order.alert.status.${order.status}.title` as TranslationKey;
      const hintKey = `order.alert.status.${order.status}.hint` as TranslationKey;
      const title = t(titleKey);
      const hint = t(hintKey);
      const name = carLabel(order);

      incoming.push({
        id: `${order.id}-${order.status}-${incoming.length}`,
        orderId: order.id,
        carName: name,
        carPrice: order.total_amount,
        status: order.status,
        at: new Date().toISOString(),
        read: false,
      });

      showOrderAlert({
        orderId: order.id,
        carId: order.order_items?.[0]?.car_id || "",
        carName: name,
        carPrice: order.total_amount,
        status: order.status,
      });

      toast.success(t("order.alert.success"), {
        description: `${title === titleKey ? t("order.alert.title") : title}. ${hint === hintKey ? t("order.alert.hint") : hint}`,
        action: {
          label: t("order.alert.viewOrders"),
          onClick: () => navigate("/orders"),
        },
        duration: 12_000,
      });
    }

    if (incoming.length) {
      persist((prev) => [...incoming, ...prev]);
      setPopupNotice(incoming[0]);
    }

    writeSeen(userId, current);
  }, [userId, isLoading, orders, showOrderAlert, t, navigate, persist]);

  const unreadCount = notices.filter((n) => !n.read).length;

  const value = useMemo(
    () => ({ notices, unreadCount, popupNotice, markAllRead, dismissPopup, isLoading }),
    [notices, unreadCount, popupNotice, markAllRead, dismissPopup, isLoading],
  );

  return (
    <CustomerNotificationContext.Provider value={value}>
      {children}
    </CustomerNotificationContext.Provider>
  );
};

export const useCustomerNotifications = () => {
  const ctx = useContext(CustomerNotificationContext);
  if (!ctx) {
    throw new Error("useCustomerNotifications must be used within CustomerNotificationProvider");
  }
  return ctx;
};
