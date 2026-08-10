import { useReports } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, ShoppingCart, Clock, CheckCircle2, BarChart3, PieChart as PieIcon } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#0093DD",
  processing: "#FB923C",
  delivered: "#22C55E",
  completed: "#16A34A",
  cancelled: "#EF4444",
};
const FALLBACK = ["#0093DD", "#FB923C", "#F59E0B", "#16A34A", "#94A3B8", "#EF4444"];

const AdminReports = () => {
  const { t } = useLanguage();
  const { data, isLoading } = useReports();

  const r = data;
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

  const stats = [
    {
      label: "Total Revenue",
      value: money(r?.totalRevenue ?? 0),
      icon: DollarSign,
      tone: "text-emerald-600 bg-emerald-500/10",
    },
    {
      label: "Total Orders",
      value: String(r?.totalOrders ?? 0),
      icon: ShoppingCart,
      tone: "text-[hsl(350_70%_48%)] bg-[hsl(350_70%_52%/0.12)]",
    },
    {
      label: "Pending Orders",
      value: String(r?.pendingOrders ?? 0),
      icon: Clock,
      tone: "text-amber-600 bg-amber-500/10",
    },
    {
      label: "Completed Orders",
      value: String(r?.completedOrders ?? 0),
      icon: CheckCircle2,
      tone: "text-sky-600 bg-sky-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.reports.title")}</h1>
        <p className="text-muted-foreground">{t("admin.reports.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(350_70%_48%)]" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="border-border/70 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    {s.label}
                    <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", s.tone)}>
                      <s.icon className="h-4 w-4" />
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  Revenue by Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={r?.revenueByMonth ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(v: number) => money(v)} />
                    <Bar dataKey="revenue" fill="hsl(350 70% 52%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(350_70%_52%/0.12)] text-[hsl(350_70%_48%)]">
                    <PieIcon className="h-4 w-4" />
                  </span>
                  Orders by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(r?.ordersByStatus?.length ?? 0) === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground">No orders yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={r?.ordersByStatus ?? []}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        label={(e) => `${e.status} (${e.count})`}
                      >
                        {(r?.ordersByStatus ?? []).map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.status] ?? FALLBACK[i % FALLBACK.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
