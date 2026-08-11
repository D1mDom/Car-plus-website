import { useMemo, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";
import { useCountUp } from "@/hooks/useCountUp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2,
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle2,
  BarChart3,
  PieChart as PieIcon,
  Download,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const now = new Date();
  const currentYear = now.getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<"all" | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11">("all");

  const toYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const buildFromTo = (year: number, month: typeof selectedMonth) => {
    if (month === "all") {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return { from: toYMD(start), to: toYMD(end) };
    }

    const m = Number(month);
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 0); // last day of month
    return { from: toYMD(start), to: toYMD(end) };
  };

  const { from, to } = useMemo(() => buildFromTo(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  const dateFilter = useMemo(() => ({ from, to }), [from, to]);
  const { data, isLoading } = useReports(dateFilter);

  const r = data;
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const hasRevenue = (r?.revenueByMonth ?? []).some((m) => m.revenue > 0);
  const hasStatus = (r?.ordersByStatus?.length ?? 0) > 0;

  const totalOrders = r?.totalOrders ?? 0;
  const pendingOrders = r?.pendingOrders ?? 0;
  const completedOrders = r?.completedOrders ?? 0;
  const totalRevenue = r?.totalRevenue ?? 0;

  const statusLabel = (status: string) => {
    const key = `orders.status.${status}`;
    const translated = t(key as never);
    return translated === key ? status : translated;
  };

  const statusBadge = (status: string) => {
    const color = STATUS_COLORS[status] ?? "#94A3B8";
    return (
      <span
        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
        style={{
          borderColor: `${color}55`,
          backgroundColor: `${color}15`,
          color,
        }}
      >
        {statusLabel(status)}
      </span>
    );
  };

  const formatCompact = (n: number) => {
    if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
    return String(Math.round(n));
  };

  const formatCount = (n: number) => Math.round(n).toLocaleString();
  const formatMoney = (n: number) => Math.round(n).toLocaleString();

  const KH_MONTHS: Record<string, string> = {
    Jan: "មករា",
    Feb: "កុម្ភៈ",
    Mar: "មិនា",
    Apr: "មេសា",
    May: "ឧសភា",
    Jun: "មិថុនា",
    Jul: "កក្កដា",
    Aug: "សីហា",
    Sep: "កញ្ញា",
    Oct: "តុលា",
    Nov: "វិច្ឆិកា",
    Dec: "ធ្នូ",
  };
  const formatMonthTick = (tick: string) => {
    const [maybeMonth, ...rest] = tick.split(" ");
    const khMonth = KH_MONTHS[maybeMonth];
    return khMonth ? `${khMonth} ${rest.join(" ")}` : tick;
  };

  const DonutMetric = ({
    value,
    label,
    unitText,
    color,
    icon: Icon,
    formatValue,
  }: {
    value: number;
    label: string;
    unitText: string;
    color: string;
    icon: (props: { className?: string }) => JSX.Element;
    formatValue: (n: number) => string;
  }) => {
    const animatedValue = useCountUp(value, 900);

    // purely visual "fill", based on this value only
    const goal = Math.max(1, animatedValue * 1.35);
    const pct = Math.max(2, Math.min(100, Math.round((animatedValue / goal) * 100)));

    return (
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-tight text-muted-foreground">{label}</p>
          </div>

          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${color}22`,
              color,
            }}
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-5 flex items-center justify-center">
          <div
            className="relative h-28 w-28"
            style={{
              background: `conic-gradient(${color} 0% ${pct}%, rgba(148,163,184,0.25) ${pct}% 100%)`,
              borderRadius: "9999px",
            }}
          >
            <div className="absolute inset-[34px] rounded-full bg-card" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-foreground">
                {formatValue(animatedValue)}
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">{unitText}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const exportCsv = () => {
    const rows = r?.exportRows ?? [];
    const header = "date,status,total";
    const body = rows
      .map((row) => `${row.date},${row.status},${row.total}`)
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carplus-orders-${from || "all"}-${to || "all"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const orderListRows = useMemo(() => {
    const rows = r?.exportRows ?? [];
    return [...rows].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [r?.exportRows]);

  const resetDates = () => {
    setSelectedYear(currentYear);
    setSelectedMonth("all");
  };
  const YEARS = useMemo(() => Array.from({ length: 10 }, (_, i) => currentYear - i), [currentYear]);
  const MONTHS = useMemo(
    () => [
      { value: "all" as const, label: t("admin.reports.month.all") },
      { value: "0" as const, label: t("admin.reports.month.jan") },
      { value: "1" as const, label: t("admin.reports.month.feb") },
      { value: "2" as const, label: t("admin.reports.month.mar") },
      { value: "3" as const, label: t("admin.reports.month.apr") },
      { value: "4" as const, label: t("admin.reports.month.may") },
      { value: "5" as const, label: t("admin.reports.month.jun") },
      { value: "6" as const, label: t("admin.reports.month.jul") },
      { value: "7" as const, label: t("admin.reports.month.aug") },
      { value: "8" as const, label: t("admin.reports.month.sep") },
      { value: "9" as const, label: t("admin.reports.month.oct") },
      { value: "10" as const, label: t("admin.reports.month.nov") },
      { value: "11" as const, label: t("admin.reports.month.dec") },
    ],
    [t],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reports-year">{t("admin.reports.year")}</Label>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => {
                setSelectedYear(Number(v));
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder={t("admin.reports.year")} />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reports-month">{t("admin.reports.month")}</Label>
            <Select
              value={selectedMonth}
              onValueChange={(v) => {
                setSelectedMonth(v as typeof selectedMonth);
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder={t("admin.reports.month")} />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={resetDates} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            {t("admin.reports.reset")}
          </Button>
        </div>
        <Button onClick={exportCsv} variant="outline" className="gap-1.5" disabled={isLoading}>
          <Download className="h-4 w-4" />
          {t("admin.reports.export")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#174080]" />
        </div>
      ) : (
        <>
          <div className="admin-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DonutMetric
              value={totalOrders}
              label={t("admin.reports.orders")}
              unitText={t("admin.reports.unit.count")}
              color="#174080"
              icon={ShoppingCart}
              formatValue={formatCount}
            />
            <DonutMetric
              value={pendingOrders}
              label={t("admin.reports.pending")}
              unitText={t("admin.reports.unit.count")}
              color="#16A34A"
              icon={Clock}
              formatValue={formatCount}
            />
            <DonutMetric
              value={totalRevenue}
              label={t("admin.reports.revenue")}
              unitText={t("admin.reports.unit.money")}
              color="#8B5CF6"
              icon={DollarSign}
              formatValue={formatMoney}
            />
          </div>

          <div className="admin-stagger grid gap-6 lg:grid-cols-2">
            <Card className="admin-card-hover border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#174080]/12 text-[#174080]">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  {t("admin.reports.byMonth")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasRevenue ? (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                    {t("admin.reports.emptyChart")}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={r?.revenueByMonth ?? []}>
                      <defs>
                        <linearGradient id="revenueBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#174080" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#174080" stopOpacity={0.35} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="month"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatMonthTick}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatMoney(Number(v))}
                      />
                      <Tooltip formatter={(v: number) => money(v)} />
                      <Bar dataKey="revenue" fill="url(#revenueBar)" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="admin-card-hover border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {t("admin.reports.byMonth")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasRevenue ? (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                    {t("admin.reports.emptyChart")}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={r?.revenueByMonth ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="month"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatMonthTick}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatMoney(Number(v))}
                      />
                      <Tooltip formatter={(v: number) => money(v)} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#16A34A"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="admin-stagger grid gap-6 lg:grid-cols-3">
            <Card className="admin-card-hover border-border/70 shadow-sm lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                    <PieIcon className="h-4 w-4" />
                  </span>
                  {t("admin.reports.byStatus")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasStatus ? (
                  <div className="flex min-h-[280px] items-center justify-center text-muted-foreground">
                    {t("admin.reports.empty")}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Tooltip
                          formatter={(v: number, name) => [
                            String(Math.round(v)),
                            statusLabel(String(name ?? "")),
                          ]}
                        />
                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          formatter={(value) => statusLabel(String(value))}
                        />
                        <Pie
                          data={r?.ordersByStatus ?? []}
                          dataKey="count"
                          nameKey="status"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {(r?.ordersByStatus ?? []).map((entry, idx) => {
                            const color = STATUS_COLORS[entry.status] ?? FALLBACK[idx % FALLBACK.length];
                            return <Cell key={entry.status} fill={color} />;
                          })}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="grid gap-2">
                      {(r?.ordersByStatus ?? []).map((entry) => {
                        const color = STATUS_COLORS[entry.status] ?? FALLBACK[0];
                        return (
                          <div key={entry.status} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                              <span className="text-sm font-medium">{statusLabel(entry.status)}</span>
                            </span>
                            <span className="text-sm text-muted-foreground">{formatCount(entry.count)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="admin-card-hover border-border/70 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#174080]/12 text-[#174080]">
                    <ShoppingCart className="h-4 w-4" />
                  </span>
                  {t("admin.reports.orders")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasStatus ? (
                  <div className="py-10 text-center text-muted-foreground">
                    {t("admin.reports.empty")}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[140px]">{t("admin.orders.col.date")}</TableHead>
                          <TableHead className="w-[160px]">{t("admin.orders.col.status")}</TableHead>
                          <TableHead className="text-right">{t("admin.orders.col.total")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderListRows.map((row) => (
                          <TableRow key={`${row.date}-${row.status}-${row.total}`}>
                            <TableCell className="text-sm">{row.date}</TableCell>
                            <TableCell>{statusBadge(row.status)}</TableCell>
                            <TableCell className="text-right font-semibold">{money(row.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
