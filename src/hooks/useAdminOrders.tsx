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
      // Mock network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockOrders: OrderWithItems[] = [
        {
          id: "ord-8839x",
          user_id: "user-1",
          total_amount: 153500,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          shipping_address: "Phnom Penh, Cambodia",
          phone: "+855 12 345 678",
          notes: "Call before delivery",
          order_items: [
            { id: "item-1", car_id: "mock-3", price: 135000 },
            { id: "item-2", car_id: "mock-1", price: 18500 }
          ],
          user_email: "teacher@school.edu"
        },
        {
          id: "ord-1192p",
          user_id: "user-2",
          total_amount: 25000,
          status: "confirmed",
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 40000000).toISOString(),
          shipping_address: "Siem Reap, Cambodia",
          phone: "+855 98 765 432",
          notes: "Gift packaging please",
          order_items: [
            { id: "item-3", car_id: "mock-15", price: 25000 }
          ],
          user_email: "demo-buyer@gmail.com"
        },
        {
          id: "ord-4422m",
          user_id: "user-3",
          total_amount: 350000,
          status: "delivered",
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
          updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
          shipping_address: "Sihanoukville, Cambodia",
          phone: "+855 15 999 888",
          notes: null,
          order_items: [
            { id: "item-4", car_id: "mock-14", price: 350000 }
          ],
          user_email: "luxury.collector@yahoo.com"
        }
      ];

      return mockOrders;
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
