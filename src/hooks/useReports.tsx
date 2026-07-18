import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrderWithItems {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_id: string;
}

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  recentOrders: OrderWithItems[];
}

export const useReports = () => {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async (): Promise<ReportData> => {
      // Mock network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const now = new Date();
      const mockOrdersData: OrderWithItems[] = [];

      // Generate some nice looking realistic mock analytics data
      const statuses = ["pending", "completed", "completed", "completed", "cancelled"];
      
      for (let i = 0; i < 45; i++) {
        const randomDaysAgo = Math.floor(Math.random() * 180); // within last 6 months
        const date = new Date(now.getTime() - randomDaysAgo * 86400000);
        
        mockOrdersData.push({
          id: `ord-${Math.random().toString(36).substr(2, 5)}`,
          total_amount: Math.floor(Math.random() * 80000) + 15000,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          created_at: date.toISOString(),
          user_id: `user-${Math.floor(Math.random() * 10)}`,
        });
      }

      // Sort recent first
      mockOrdersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculate metrics
      const totalRevenue = mockOrdersData.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const totalOrders = mockOrdersData.length;
      const pendingOrders = mockOrdersData.filter(o => o.status === "pending").length;
      const completedOrders = mockOrdersData.filter(o => o.status === "completed").length;

      // Revenue by month (last 6 months)
      const monthlyRevenue: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleString("default", { month: "short", year: "numeric" });
        monthlyRevenue[key] = 0;
      }

      mockOrdersData.forEach(order => {
        const date = new Date(order.created_at);
        const key = date.toLocaleString("default", { month: "short", year: "numeric" });
        if (monthlyRevenue[key] !== undefined) {
          monthlyRevenue[key] += Number(order.total_amount);
        }
      });

      const revenueByMonth = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue,
      }));

      // Orders by status
      const statusCounts: Record<string, number> = {};
      mockOrdersData.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      return {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        revenueByMonth,
        ordersByStatus,
        recentOrders: mockOrdersData.slice(0, 5),
      };
    },
  });
};
