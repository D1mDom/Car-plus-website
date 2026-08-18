import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrders } from "@/hooks/useMyOrders";

const QUERY_KEY = ["sold-car-ids"] as const;
const LOCAL_KEY = "carplus-sold-car-ids-v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any; rpc: (fn: string) => any };

const parseIds = (rows: unknown): string[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      if (typeof row === "string" || typeof row === "number") return String(row);
      if (row && typeof row === "object" && "car_id" in row) {
        const id = (row as { car_id: unknown }).car_id;
        return id == null ? "" : String(id);
      }
      return "";
    })
    .filter((id) => id && id !== "walk-in" && !id.startsWith("mock-"));
};

const readLocalSold = (): string[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const rememberSoldCar = (carId: string) => {
  const id = String(carId);
  if (!id || id.startsWith("mock-") || id === "walk-in") return;
  const next = Array.from(new Set([...readLocalSold(), id]));
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

export const refreshSoldCars = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: QUERY_KEY });
  void qc.invalidateQueries({ queryKey: ["cars"] });
};

export const SoldCarsSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("sold-car-ids-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        refreshSoldCars(queryClient);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => {
        refreshSoldCars(queryClient);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cars" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["cars"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
};

export const useSoldCarIds = () => {
  const { user } = useAuth();
  const { data: myOrders = [] } = useMyOrders();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<string[]> => {
      const rpc = await db.rpc("get_sold_car_ids");
      if (!rpc.error) return parseIds(rpc.data);

      const fallback = await db
        .from("order_items")
        .select("car_id, orders!inner(status)")
        .not("orders.status", "eq", "cancelled");
      if (!fallback.error) return parseIds(fallback.data);

      return readLocalSold();
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  return useMemo(() => {
    const ids = new Set(query.data ?? []);
    for (const id of readLocalSold()) ids.add(id);
    if (user) {
      for (const order of myOrders) {
        if (order.status === "cancelled") continue;
        for (const item of order.order_items ?? []) {
          if (item.car_id) ids.add(String(item.car_id));
        }
      }
    }
    return ids;
  }, [query.data, myOrders, user]);
};

export const useIsCarSold = (carId?: string | null, carSoldFlag?: boolean) => {
  const sold = useSoldCarIds();
  if (carSoldFlag) return true;
  if (!carId || String(carId).startsWith("mock-")) return false;
  return sold.has(String(carId));
};
