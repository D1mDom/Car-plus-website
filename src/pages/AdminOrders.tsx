import { useMemo, useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useCars } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { useCountUp } from "@/hooks/useCountUp";
import { useContact, DEFAULT_CONTACT } from "@/hooks/useContact";
import {
  useAdminOrders,
  useUpdateOrderStatus,
  useCreateOrder,
  useDeleteOrder,
  ORDER_STATUSES,
  type Order,
} from "@/hooks/useAdminOrders";
import { useCreateReceipt } from "@/hooks/useReceipts";
import { printReceipt, type ReceiptPrintLabels } from "@/components/admin/receiptPrint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Package,
  FileText,
  Clock,
  Cog,
  CheckCircle2,
  X,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const statusVariant = (s: string): "default" | "secondary" | "outline" | "destructive" =>
  s === "completed" || s === "delivered"
    ? "default"
    : s === "cancelled"
      ? "destructive"
      : s === "pending"
        ? "outline"
        : "secondary";

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
  const deleteOrder = useDeleteOrder();
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
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
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
  }, [orders, search, statusFilter]);

  const hasFilters = search.trim() !== "" || statusFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
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

  const itemsLabel = (o: Order) =>
    o.order_items?.length
      ? o.order_items.map((i) => i.car_name || i.car_id || "Car").join(", ")
      : o.notes || "—";

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
      <Button size="sm" variant="destructive" onClick={() => setDeleteId(o.id)}>
        <Trash2 className="h-4 w-4" />
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
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.orders.search")}
                className="sm:max-w-xs"
              />
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="sm:w-[180px]">
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
              {hasFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  {t("admin.filter.clear")}
                </Button>
              ) : null}
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
                      <Badge variant={statusVariant(o.status)} className="shrink-0">
                        {statusLabel(o.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-medium leading-snug">{itemsLabel(o)}</div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-lg font-semibold tabular-nums">{money(o.total_amount)}</span>
                      <Select
                        value={o.status}
                        onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}
                      >
                        <SelectTrigger className="h-9 w-full min-w-[140px] sm:w-[160px]">
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
                      <TableHead>{t("admin.orders.col.status")}</TableHead>
                      <TableHead>{t("admin.orders.col.update")}</TableHead>
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
                        <TableCell className="text-sm">{itemsLabel(o)}</TableCell>
                        <TableCell className="font-semibold">{money(o.total_amount)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(o.status)}>{statusLabel(o.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={o.status}
                            onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
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
                        </TableCell>
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

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.orders.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.orders.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("form.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteOrder.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              {t("admin.orders.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOrders;
