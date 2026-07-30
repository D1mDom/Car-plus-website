import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MyOrderItem { id: string; car_id: string | null; car_name: string | null; price: number; }
export interface MyOrder {
  id: string; status: string; total_amount: number; created_at: string;
  order_items: MyOrderItem[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export const useMyOrders = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MyOrder[]> => {
      const { data, error } = await db
        .from("orders")
        .select("id, status, total_amount, created_at, order_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) { console.warn("my orders query failed:", error.message); return []; }
      return data ?? [];
    },
  });
};
