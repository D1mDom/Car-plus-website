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

export const useAdminOrders = () =>
  useQuery({
    queryKey: ["admin-orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await db
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) { console.warn("orders query failed:", error.message); return []; }
      return data ?? [];
    },
  });

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
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Order status updated");
    },
    onError: (e) => toast.error("Failed to update status: " + msg(e)),
  });
};

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewOrderInput) => {
      const { data: order, error } = await db
        .from("orders")
        .insert({
          customer_name: input.customer_name,
          phone: input.phone,
          status: input.status,
          total_amount: input.total_amount,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      if (input.items.length) {
        const rows = input.items.map((it) => ({
          order_id: order.id, car_id: it.car_id ?? null, car_name: it.car_name, price: it.price,
        }));
        const { error: e2 } = await db.from("order_items").insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
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
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Order deleted");
    },
    onError: (e) => toast.error("Failed to delete: " + msg(e)),
  });
};
