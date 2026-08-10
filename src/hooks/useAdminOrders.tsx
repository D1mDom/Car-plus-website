import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrderItem {
  id: string;
  car_id: string | null;
  car_name: string | null;
  price: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  phone: string | null;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export interface NewOrderInput {
  customer_name: string;
  phone: string;
  status: string;
  total_amount: number;
  notes?: string;
  items: { car_id?: string | null; car_name: string; price: number }[];
}

export const ORDER_STATUSES = [
  "pending", "confirmed", "processing", "delivered", "completed", "cancelled",
] as const;

// orders/order_items aren't in the generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };
const msg = (e: unknown) =>
  e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "error";

const refreshOrders = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: ["admin-orders"] });
  void qc.invalidateQueries({ queryKey: ["my-orders"] });
  void qc.invalidateQueries({ queryKey: ["reports"] });
};

export const useAdminOrders = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await db
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("orders query failed:", error.message);
        return [];
      }
      return data ?? [];
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Live updates when customers place orders or status changes elsewhere
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          refreshOrders(queryClient);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => {
          refreshOrders(queryClient);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await db
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refreshOrders(qc);
      toast.success("Order status updated");
    },
    onError: (e) => toast.error("Failed to update status: " + msg(e)),
  });
};

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewOrderInput) => {
      // New schema first
      let order: { id: string } | null = null;
      const first = await db
        .from("orders")
        .insert({
          customer_name: input.customer_name,
          phone: input.phone,
          status: input.status,
          total_amount: input.total_amount,
          notes: input.notes ?? null,
        })
        .select("id")
        .single();

      if (first.error && /customer_name/i.test(String(first.error.message ?? ""))) {
        const legacy = await db
          .from("orders")
          .insert({
            phone: input.phone,
            status: input.status,
            total_amount: input.total_amount,
            notes: [input.customer_name, input.notes].filter(Boolean).join(" · ") || null,
          })
          .select("id")
          .single();
        if (legacy.error) throw legacy.error;
        order = legacy.data;
      } else if (first.error) {
        throw first.error;
      } else {
        order = first.data;
      }

      if (!order?.id) throw new Error("Order was not created");

      if (input.items.length) {
        const withName = input.items.map((it) => ({
          order_id: order!.id,
          car_id: it.car_id ?? null,
          car_name: it.car_name,
          price: it.price,
        }));
        const e2 = await db.from("order_items").insert(withName);
        if (e2.error && /car_name/i.test(String(e2.error.message ?? ""))) {
          const legacyItems = input.items.map((it) => ({
            order_id: order!.id,
            car_id: it.car_id ?? "walk-in",
            price: it.price,
          }));
          const e3 = await db.from("order_items").insert(legacyItems);
          if (e3.error) {
            await db.from("orders").delete().eq("id", order.id);
            throw e3.error;
          }
        } else if (e2.error) {
          await db.from("orders").delete().eq("id", order.id);
          throw e2.error;
        }
      }
    },
    onSuccess: () => {
      refreshOrders(qc);
      toast.success("Order created");
    },
    onError: (e) => toast.error("Failed to create order: " + msg(e)),
  });
};

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refreshOrders(qc);
      toast.success("Order deleted");
    },
    onError: (e) => toast.error("Failed to delete: " + msg(e)),
  });
};
