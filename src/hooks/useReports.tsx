import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Reports {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  exportRows: { date: string; status: string; total: number }[];
}

export type ReportsDateFilter = { from?: string; to?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function inDateRange(iso: string, from?: string, to?: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (d < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`);
    if (d > end) return false;
  }
  return true;
}

export const useReports = (opts?: ReportsDateFilter) =>
  useQuery({
    queryKey: ["reports", opts?.from ?? null, opts?.to ?? null],
    queryFn: async (): Promise<Reports> => {
      const { data, error } = await db.from("orders").select("status,total_amount,created_at");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allOrders: any[] = error ? [] : data ?? [];
      const orders = allOrders.filter((o) => inDateRange(o.created_at, opts?.from, opts?.to));

      const totalOrders = orders.length;
      // Revenue excludes cancelled orders so it reflects real sales.
      const paid = orders.filter((o) => o.status !== "cancelled");
      const totalRevenue = paid.reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const completedOrders = orders.filter(
        (o) => o.status === "completed" || o.status === "delivered"
      ).length;

      // Revenue for the last 6 months (chronological), within filtered set.
      const now = new Date();
      const revenueByMonth: { month: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        const revenue = paid
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

      const exportRows = orders.map((o) => ({
        date: new Date(o.created_at).toISOString().slice(0, 10),
        status: String(o.status ?? ""),
        total: Number(o.total_amount || 0),
      }));

      return {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        revenueByMonth,
        ordersByStatus,
        exportRows,
      };
    },
  });
