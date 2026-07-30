import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Car } from "@/hooks/useCars";

// Customer-side ordering: a logged-in user places an order for a car. The row
// goes into the orders table (user_id = theirs) so admins see it in Order
// Management and it counts in Sales Reports. RLS lets users insert only their
// own orders.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export const usePlaceOrder = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (car: Car) => {
      if (!user) throw new Error("login-required");
      const name =
        (user.user_metadata?.full_name as string) || user.email || "Customer";
      const { data: order, error } = await db
        .from("orders")
        .insert({
          user_id: user.id,
          customer_name: name,
          status: "pending",
          total_amount: car.price,
        })
        .select()
        .single();
      if (error) throw error;
      const { error: e2 } = await db.from("order_items").insert({
        order_id: order.id,
        car_id: car.id,
        car_name: car.name,
        price: car.price,
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Order placed! We will contact you soon.");
    },
    onError: (e: unknown) => {
      const m = e instanceof Error ? e.message : "error";
      if (m === "login-required") toast.error("Please sign in to place an order");
      else toast.error("Failed to place order: " + m);
    },
  });
};
