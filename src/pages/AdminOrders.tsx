import { useMemo, useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { useSearchParams, Link } from "react-router-dom";
import { useCars, type Car } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { useCountUp } from "@/hooks/useCountUp";
import { useContact, DEFAULT_CONTACT } from "@/hooks/useContact";
import {
  useAdminOrders,
  useUpdateOrderStatus,
  useCreateOrder,
  ORDER_STATUSES,
  type Order,
  type OrderItem,
} from "@/hooks/useAdminOrders";
import { useCreateReceipt } from "@/hooks/useReceipts";
import { printReceipt, type ReceiptPrintLabels } from "@/components/admin/receiptPrint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Package,
  FileText,
  Clock,
  Cog,
  CheckCircle2,
  X,
  Bell,
  Car,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";
import { onImgError } from "@/lib/imageFallback";
import DeliveryTimeline from "@/components/DeliveryTimeline";
import { NEXT_DELIVERY_STATUS } from "@/lib/orderFlow";

type MonthFilter = "all" | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11";
type SortFilter = "newest" | "oldest" | "amountHigh" | "amountLow";

const FILTER_YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);

const nextActionKey = (status: string): TranslationKey | null => {
  switch (status) {
    case "pending":
      return "admin.orders.flow.confirm";
    case "confirmed":
      return "admin.orders.flow.process";
    case "processing":
      return "admin.orders.flow.deliver";
    case "delivered":
      return "admin.orders.flow.complete";
    default:
      return null;
  }
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
}) {
  const n = useCountUp(value);
  return (
    <Card className="admin-card-hover border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {label}
          <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", tone)}>
            <Icon className="h-4 w-4" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight tabular-nums">{n.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

const AdminOrders = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: orders = [], isLoading } = useAdminOrders();
  const { data: cars = [] } = useCars();
  const updateStatus = useUpdateOrderStatus();
  const createOrder = useCreateOrder();
  const createReceipt = useCreateReceipt();
  const { data: contact = DEFAULT_CONTACT } = useContact();

  const realCars = cars.filter((c) => !String(c.id).startsWith("mock-"));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    carId: "",
    total: "",
    status: "pending",
    notes: "",
  });
  const [receiptBusyId, setReceiptBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>("all");
  const [carFilter, setCarFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortFilter>("newest");

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      setStatusFilter(status);
    } else {
      setStatusFilter("all");
    }
  }, [searchParams]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === "all") {
      searchParams.delete("status");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ status: value }, { replace: true });
    }
  };

  const receiptLabels: ReceiptPrintLabels = useMemo(
    () => ({
      companyName: t("admin.receipts.companyName"),
      invoice: t("admin.receipts.invoice"),
      invoiceTo: t("admin.receipts.invoiceTo"),
      invoiceDate: t("admin.receipts.invoiceDate"),
      description: t("admin.receipts.description"),
      price: t("admin.receipts.price"),
      qty: t("admin.receipts.qty"),
      total: t("admin.receipts.total"),
      subtotal: t("admin.receipts.subtotal"),
      tax: t("admin.receipts.tax"),
      grandTotal: t("admin.receipts.grandTotal"),
      carInfo: t("admin.receipts.carInfo"),
      year: t("admin.receipts.year"),
      make: t("admin.receipts.make"),
      model: t("admin.receipts.model"),
      paymentInfo: t("admin.receipts.paymentInfo"),
      bankName: t("admin.receipts.bankName"),
      accountNo: t("admin.receipts.accountNo"),
      contactUs: t("admin.receipts.contactUs"),
      paymentMethods: {
        cash: t("admin.receipts.pay.cash"),
        transfer: t("admin.receipts.pay.transfer"),
        card: t("admin.receipts.pay.card"),
        other: t("admin.receipts.pay.other"),
      },
      title: t("admin.receipts.docTitle"),
      receiptNo: t("admin.receipts.no"),
      date: t("admin.receipts.date"),
      customer: t("admin.receipts.customer"),
      phone: t("admin.receipts.phone"),
      payment: t("admin.receipts.payment"),
      item: t("admin.receipts.item"),
      code: t("admin.receipts.code"),
      amount: t("admin.receipts.amount"),
      notes: t("admin.receipts.notes"),
      customerSign: t("admin.receipts.customerSign"),
      companySign: t("admin.receipts.companySign"),
      thanks: t("admin.receipts.thanks"),
    }),
    [t]
  );

  const statusLabel = (s: string) => {
    const key = `orders.status.${s}` as TranslationKey;
    const translated = t(key);
    return translated === key ? s : translated;
  };

  const money = (n: number) => `$${Number(n).toLocaleString()}`;

  const monthOptions = useMemo(
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

  const carOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const order of orders) {
      for (const item of order.order_items ?? []) {
        const id = item.car_id || item.car_name;
        if (!id) continue;
        map.set(id, item.car_name || item.car_id || id);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  const orderMatchesPeriod = (order: Order) => {
    if (selectedYear === "all" && selectedMonth === "all") return true;
    const d = new Date(order.created_at);
    if (selectedYear !== "all" && d.getFullYear() !== selectedYear) return false;
    if (selectedMonth !== "all" && d.getMonth() !== Number(selectedMonth)) return false;
    return true;
  };

  const orderMatchesCar = (order: Order) => {
    if (carFilter === "all") return true;
    return (order.order_items ?? []).some(
      (item) => item.car_id === carFilter || item.car_name === carFilter,
    );
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = orders.filter((o) => {
      if (!orderMatchesPeriod(o)) return false;
      if (!orderMatchesCar(o)) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (q) {
        const name = (o.customer_name || o.notes?.split("\n")[0] || "").toLowerCase();
        const phone = (o.phone || "").toLowerCase();
        const items = (
          o.order_items?.map((i) => i.car_name || i.car_id || "").join(" ") ||
          o.notes ||
          ""
        ).toLowerCase();
        if (!name.includes(q) && !phone.includes(q) && !items.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "amountHigh":
          return b.total_amount - a.total_amount;
        case "amountLow":
          return a.total_amount - b.total_amount;
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [orders, search, statusFilter, selectedYear, selectedMonth, carFilter, sortBy]);

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    selectedYear !== "all" ||
    selectedMonth !== "all" ||
    carFilter !== "all" ||
    sortBy !== "newest";
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSelectedYear("all");
    setSelectedMonth("all");
    setCarFilter("all");
    setSortBy("newest");
    setSearchParams({}, { replace: true });
  };

  const issueReceipt = (order: Order) => {
    const item = order.order_items?.[0];
    const matched = item?.car_id ? realCars.find((c) => c.id === item.car_id) : undefined;
    const carName =
      item?.car_name ||
      matched?.name ||
      order.order_items?.map((i) => i.car_name || "Car").filter(Boolean).join(", ") ||
      "Vehicle";
    const unit_price = Number(item?.price ?? order.total_amount) || 0;
    setReceiptBusyId(order.id);
    createReceipt.mutate(
      {
        order_id: order.id,
        customer_name:
          order.customer_name || order.notes?.split("\n")[0]?.trim() || t("admin.orders.walkIn"),
        phone: order.phone || undefined,
        description: carName,
        car_name: carName,
        year: matched ? String(matched.year) : undefined,
        make: matched ? matched.name.split(" ")[0] : undefined,
        model: matched?.model,
        unit_price,
        qty: 1,
        tax_rate: 0,
        payment_method: "cash",
        bank_name: "ABA Bank",
        account_no: contact.phone || undefined,
        notes: order.notes || undefined,
      },
      {
        onSuccess: (receipt) => {
          printReceipt(receipt, contact, receiptLabels);
        },
        onSettled: () => setReceiptBusyId(null),
      }
    );
  };

  const pickCar = (carId: string) => {
    const car = realCars.find((c) => c.id === carId);
    setForm((f) => ({ ...f, carId, total: car ? String(car.price) : f.total }));
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const car = realCars.find((c) => c.id === form.carId);
    const totalAmount = form.total !== "" ? Number(form.total) : car ? car.price : 0;

    if (!car && (!form.total || totalAmount <= 0)) {
      toast.error(t("admin.orders.validationCarOrTotal"));
      return;
    }

    createOrder.mutate(
      {
        customer_name: form.customer_name.trim() || t("admin.orders.walkIn"),
        phone: form.phone.trim(),
        status: form.status,
        total_amount: totalAmount,
        notes: form.notes.trim() || undefined,
        items: car ? [{ car_id: car.id, car_name: car.name, price: car.price }] : [],
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ customer_name: "", phone: "", carId: "", total: "", status: "pending", notes: "" });
        },
      },
    );
  };

  const customerCell = (o: Order) => (
    <>
      <div className="font-medium">
        {o.customer_name || o.notes?.split("\n")[0]?.trim() || "—"}
      </div>
      {o.phone ? <div className="text-xs text-muted-foreground">{o.phone}</div> : null}
      {o.notes?.includes("Telegram:") ? (
        <div className="text-xs text-[#229ED9]">
          {o.notes.split("\n").find((l) => l.startsWith("Telegram:"))}
        </div>
      ) : null}
    </>
  );

  const findCarForItem = (item: OrderItem): Car | undefined => {
    if (item.car_id) {
      const byId = cars.find((c) => String(c.id) === String(item.car_id));
      if (byId) return byId;
    }
    const name = (item.car_name || "").trim().toLowerCase();
    if (!name) return undefined;
    return cars.find(
      (c) =>
        c.name.toLowerCase() === name ||
        c.name.toLowerCase().includes(name) ||
        name.includes(c.name.toLowerCase()),
    );
  };

  const itemsCell = (o: Order) => {
    const items = o.order_items ?? [];
    if (!items.length) {
      return <span className="text-sm text-muted-foreground">{o.notes || "—"}</span>;
    }
    return (
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => {
          const car = findCarForItem(item);
          const name = item.car_name || car?.name || item.car_id || "Car";
          const image = car?.image || car?.images?.[0];
          const inner = (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="h-12 w-[3.75rem] shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted">
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    onError={onImgError}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-snug text-foreground">{name}</p>
                {car ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {[car.year, car.bodyType].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>
          );
          return car ? (
            <Link
              key={item.id || `${o.id}-${idx}`}
              to={`/car/${car.id}`}
              className="rounded-lg transition-opacity hover:opacity-80"
            >
              {inner}
            </Link>
          ) : (
            <div key={item.id || `${o.id}-${idx}`}>{inner}</div>
          );
        })}
      </div>
    );
  };

  const statusFlow = (o: Order) => {
    const next = NEXT_DELIVERY_STATUS[o.status];
    const action = nextActionKey(o.status);
    const canCancel = o.status !== "completed" && o.status !== "cancelled";
    return (
      <div className="min-w-[220px] max-w-[280px] space-y-2.5">
        <DeliveryTimeline status={o.status} compact />
        <div className="flex flex-wrap items-center gap-1.5">
          {next && action ? (
            <Button
              size="sm"
              className="h-8 flex-1 gap-1.5 bg-[#174080] hover:bg-[#143871]"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: o.id, status: next })}
            >
              <Bell className="h-3.5 w-3.5" />
              {t(action)}
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: o.id, status: "cancelled" })}
            >
              {t("admin.orders.flow.cancel")}
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  const rowActions = (o: Order) => (
    <div className="flex justify-end gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="gap-1"
        disabled={receiptBusyId === o.id || createReceipt.isPending}
        onClick={() => issueReceipt(o)}
        title={t("admin.receipts.fromOrder")}
      >
        {receiptBusyId === o.id ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={() => setOpen(true)} className="gap-1.5 transition-transform active:scale-95">
          <Plus className="h-4 w-4" />
          {t("admin.orders.new")}
        </Button>
      </div>

      <div className="admin-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("admin.orders.statTotal")}
          value={orders.length}
          icon={Package}
          tone="text-[#174080] bg-[#174080]/12"
        />
        <StatCard
          label={t("admin.orders.statPending")}
          value={orders.filter((o) => o.status === "pending").length}
          icon={Clock}
          tone="text-amber-600 bg-amber-500/10"
        />
        <StatCard
          label={t("admin.orders.statProcessing")}
          value={orders.filter((o) => o.status === "processing").length}
          icon={Cog}
          tone="text-orange-600 bg-orange-500/10"
        />
        <StatCard
          label={t("admin.orders.statCompleted")}
          value={
            orders.filter((o) => o.status === "completed" || o.status === "delivered").length
          }
          icon={CheckCircle2}
          tone="text-emerald-600 bg-emerald-500/10"
        />
      </div>

      <Card className="animate-admin-pop border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#174080]" />
              {t("admin.orders.list")}
            </CardTitle>
            {orders.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {filteredOrders.length} {t("admin.common.results")}
              </p>
            ) : null}
          </div>
          {orders.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="orders-year">{t("admin.reports.year")}</Label>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(v) => setSelectedYear(v === "all" ? "all" : Number(v))}
                  >
                    <SelectTrigger id="orders-year" className="sm:w-[140px]">
                      <SelectValue placeholder={t("admin.reports.year")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.orders.filterAllYears")}</SelectItem>
                      {FILTER_YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orders-month">{t("admin.reports.month")}</Label>
                  <Select
                    value={selectedMonth}
                    onValueChange={(v) => setSelectedMonth(v as MonthFilter)}
                  >
                    <SelectTrigger id="orders-month" className="sm:w-[160px]">
                      <SelectValue placeholder={t("admin.reports.month")} />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orders-status">{t("admin.orders.filterStatus")}</Label>
                  <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger id="orders-status" className="sm:w-[180px]">
                      <SelectValue placeholder={t("admin.orders.filterStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.orders.filterAll")}</SelectItem>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orders-car">{t("admin.orders.filterCar")}</Label>
                  <Select value={carFilter} onValueChange={setCarFilter}>
                    <SelectTrigger id="orders-car" className="sm:w-[200px]">
                      <SelectValue placeholder={t("admin.orders.filterCar")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.orders.filterAllCars")}</SelectItem>
                      {carOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-1.5 sm:flex-1 sm:min-w-[200px]">
                  <Label htmlFor="orders-search">{t("admin.orders.searchLabel")}</Label>
                  <Input
                    id="orders-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("admin.orders.search")}
                    className="sm:max-w-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orders-sort">{t("admin.orders.filterSort")}</Label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortFilter)}>
                    <SelectTrigger id="orders-sort" className="sm:w-[180px]">
                      <SelectValue placeholder={t("admin.orders.filterSort")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{t("admin.orders.sort.newest")}</SelectItem>
                      <SelectItem value="oldest">{t("admin.orders.sort.oldest")}</SelectItem>
                      <SelectItem value="amountHigh">{t("admin.orders.sort.amountHigh")}</SelectItem>
                      <SelectItem value="amountLow">{t("admin.orders.sort.amountLow")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {hasFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5 sm:mb-0.5">
                    <X className="h-3.5 w-3.5" />
                    {t("admin.filter.clear")}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>{t("admin.orders.empty")}</p>
              <Button className="mt-4 gap-1.5" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("admin.orders.createFirst")}
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>{t("admin.orders.noResults")}</p>
              <Button variant="outline" className="mt-4 gap-1.5" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                {t("admin.filter.clear")}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {filteredOrders.map((o, i) => (
                  <div
                    key={o.id}
                    className="space-y-3 rounded-xl border border-border/70 p-3"
                    style={{
                      animation: "adminRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
                      animationDelay: `${Math.min(i, 12) * 0.03 + 0.1}s`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">{customerCell(o)}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </div>
                    <div>{itemsCell(o)}</div>
                    <div className="text-lg font-semibold tabular-nums">{money(o.total_amount)}</div>
                    {statusFlow(o)}
                    <div className="flex justify-end border-t border-border/50 pt-2">{rowActions(o)}</div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.orders.col.customer")}</TableHead>
                      <TableHead>{t("admin.orders.col.date")}</TableHead>
                      <TableHead>{t("admin.orders.col.items")}</TableHead>
                      <TableHead>{t("admin.orders.col.total")}</TableHead>
                      <TableHead className="min-w-[240px]">{t("admin.orders.col.delivery")}</TableHead>
                      <TableHead className="text-right">{t("admin.orders.col.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((o, i) => (
                      <TableRow
                        key={o.id}
                        className="transition-colors hover:bg-muted/50"
                        style={{
                          animation: "adminRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
                          animationDelay: `${Math.min(i, 12) * 0.03 + 0.1}s`,
                        }}
                      >
                        <TableCell>{customerCell(o)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(o.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-[280px]">{itemsCell(o)}</TableCell>
                        <TableCell className="font-semibold">{money(o.total_amount)}</TableCell>
                        <TableCell className="align-top">{statusFlow(o)}</TableCell>
                        <TableCell className="text-right">{rowActions(o)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.orders.form.title")}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("admin.orders.form.name")}</Label>
                <Input
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder={t("admin.orders.form.name")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.orders.form.phone")}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value.replace(/[^0-9+\-\s()]/g, "") })
                  }
                  placeholder="0xx xxx xxx"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.orders.form.car")}</Label>
              <Select value={form.carId || undefined} onValueChange={pickCar}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.orders.form.selectCar")} />
                </SelectTrigger>
                <SelectContent>
                  {realCars.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      {t("admin.orders.noCarsInDb")}
                    </SelectItem>
                  ) : (
                    realCars.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — ${c.price.toLocaleString()}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {realCars.length === 0 ? (
                <p className="text-xs text-amber-600">{t("admin.orders.noCarsHint")}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("admin.orders.form.total")}</Label>
                <Input
                  type="number"
                  value={form.total}
                  onChange={(e) => setForm({ ...form, total: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.orders.form.status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.orders.form.notes")}</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t("admin.orders.form.notes")}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={createOrder.isPending}>
                {createOrder.isPending ? t("form.saving") : t("admin.orders.form.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
