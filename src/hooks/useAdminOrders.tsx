import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderWithItems {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  shipping_address: string | null;
  phone: string | null;
  notes: string | null;
  order_items: {
    id: string;
    car_id: string;
    price: number;
  }[];
  user_email?: string;
}

export const useAdminOrders = () => {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async (): Promise<OrderWithItems[]> => {
      // Orders with their line items in one query (admin RLS allows viewing all).
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as OrderWithItems[];
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      // Update order status in database
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Send status notification email
      try {
        const { error: emailError } = await supabase.functions.invoke("send-order-status-email", {
          body: { orderId, newStatus: status },
        });

        if (emailError) {
          console.error("Failed to send status email:", emailError);
        }
      } catch (emailErr) {
        console.error("Email notification error:", emailErr);
      }

      return { orderId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Order status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update order status: " + error.message);
    },
  });
};

export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500" },
  { value: "processing", label: "Processing", color: "bg-purple-500" },
  { value: "shipped", label: "Shipped", color: "bg-cyan-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
];
