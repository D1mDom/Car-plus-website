import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const QUERY_KEY = ["sold-car-ids"] as const;

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

export const refreshSoldCars = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: QUERY_KEY });
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
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
};

export const useSoldCarIds = () => {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<string[]> => {
      const rpc = await db.rpc("get_sold_car_ids");
      if (!rpc.error) return parseIds(rpc.data);

      const fallback = await db
        .from("order_items")
        .select("car_id, orders!inner(status)")
        .not("orders.status", "eq", "cancelled");
      if (fallback.error) {
        console.warn("sold cars query failed:", fallback.error.message ?? rpc.error?.message);
        return [];
      }
      return parseIds(fallback.data);
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  return useMemo(() => new Set(query.data ?? []), [query.data]);
};

export const useIsCarSold = (carId?: string | null) => {
  const sold = useSoldCarIds();
  if (!carId || String(carId).startsWith("mock-")) return false;
  return sold.has(String(carId));
};
