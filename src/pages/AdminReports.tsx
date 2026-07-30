import { Navigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useReports } from "@/hooks/useReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, DollarSign, ShoppingCart, Clock, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// Car Plus brand: orange-forward, with semantic hints per order status.
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
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { data, isLoading } = useReports();

  if (authLoading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background"><Header />
        <main className="pt-24 pb-16"><div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
          <Button asChild><Link to="/">Go Home</Link></Button>
        </div></main><Footer />
      </div>
    );
  }

  const r = data;
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

  const stats = [
    { label: "Total Revenue", value: money(r?.totalRevenue ?? 0), icon: DollarSign },
    { label: "Total Orders", value: String(r?.totalOrders ?? 0), icon: ShoppingCart },
    { label: "Pending Orders", value: String(r?.pendingOrders ?? 0), icon: Clock },
    { label: "Completed Orders", value: String(r?.completedOrders ?? 0), icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />Back to Admin
          </Link>
          <div className="mb-8">
            <h1 className="text-2xl font-bold sm:text-3xl">Sales Reports</h1>
            <p className="text-muted-foreground">View your business analytics</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((s) => (
                  <Card key={s.label}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{s.label}</span>
                        <s.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold">{s.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Revenue by Month</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={r?.revenueByMonth ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip formatter={(v: number) => money(v)} />
                        <Bar dataKey="revenue" fill="#0093DD" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Orders by Status</CardTitle></CardHeader>
                  <CardContent>
                    {(r?.ordersByStatus?.length ?? 0) === 0 ? (
                      <div className="h-[280px] flex items-center justify-center text-muted-foreground">No orders yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={r?.ordersByStatus ?? []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={95} label={(e) => `${e.status} (${e.count})`}>
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
      </main>
      <Footer />
    </div>
  );
};

export default AdminReports;
