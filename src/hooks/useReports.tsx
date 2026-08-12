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

function buildRevenueByMonth(
  paid: { created_at: string; total_amount: unknown }[],
  from?: string,
  to?: string
): { month: string; revenue: number }[] {
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const end = to ? new Date(`${to}T23:59:59.999`) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const now = new Date();
    const revenueByMonth: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      const revenue = sumMonthRevenue(paid, d.getFullYear(), d.getMonth());
      revenueByMonth.push({ month: label, revenue });
    }
    return revenueByMonth;
  }

  const buckets: { year: number; month: number; label: string }[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    buckets.push({
      year: cursor.getFullYear(),
      month: cursor.getMonth(),
      label: `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return buckets.map(({ year, month, label }) => ({
    month: label,
    revenue: sumMonthRevenue(paid, year, month),
  }));
}

function sumMonthRevenue(
  paid: { created_at: string; total_amount: unknown }[],
  year: number,
  month: number
): number {
  return paid
    .filter((o) => {
      const od = new Date(o.created_at);
      return od.getFullYear() === year && od.getMonth() === month;
    })
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);
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
      const paid = orders.filter((o) => o.status !== "cancelled");
      const totalRevenue = paid.reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const completedOrders = orders.filter(
        (o) => o.status === "completed" || o.status === "delivered"
      ).length;

      const revenueByMonth = buildRevenueByMonth(paid, opts?.from, opts?.to);

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
