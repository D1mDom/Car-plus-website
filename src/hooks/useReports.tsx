import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Reports {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const useReports = () =>
  useQuery({
    queryKey: ["reports"],
    queryFn: async (): Promise<Reports> => {
      const { data, error } = await db.from("orders").select("status,total_amount,created_at");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orders: any[] = error ? [] : data ?? [];

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const completedOrders = orders.filter(
        (o) => o.status === "completed" || o.status === "delivered"
      ).length;

      // Revenue for the last 6 months (chronological).
      const now = new Date();
      const revenueByMonth: { month: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        const revenue = orders
          .filter((o) => {
            const od = new Date(o.created_at);
            return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
          })
          .reduce((s, o) => s + Number(o.total_amount || 0), 0);
        revenueByMonth.push({ month: label, revenue });
      }

      const statusMap = new Map<string, number>();
      orders.forEach((o) => statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1));
      const ordersByStatus = Array.from(statusMap, ([status, count]) => ({ status, count }));

      return { totalRevenue, totalOrders, pendingOrders, completedOrders, revenueByMonth, ordersByStatus };
    },
  });
