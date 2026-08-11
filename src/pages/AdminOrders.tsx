import { useMemo, useState } from "react";
import { useCars } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { useContact, DEFAULT_CONTACT } from "@/hooks/useContact";
import {
  useAdminOrders, useUpdateOrderStatus, useCreateOrder, useDeleteOrder, ORDER_STATUSES,
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
import { Loader2, Plus, Trash2, Package, FileText } from "lucide-react";

const statusVariant = (s: string): "default" | "secondary" | "outline" | "destructive" =>
  s === "completed" || s === "delivered" ? "default"
    : s === "cancelled" ? "destructive"
    : s === "pending" ? "outline" : "secondary";

const AdminOrders = () => {
  const { t } = useLanguage();
  const { data: orders = [], isLoading } = useAdminOrders();
  const { data: cars = [] } = useCars();
  const updateStatus = useUpdateOrderStatus();
  const createOrder = useCreateOrder();
  const deleteOrder = useDeleteOrder();
  const createReceipt = useCreateReceipt();
  const { data: contact = DEFAULT_CONTACT } = useContact();

  const realCars = cars.filter((c) => !String(c.id).startsWith("mock-"));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: "", phone: "", carId: "", total: "", status: "pending", notes: "" });
  const [receiptBusyId, setReceiptBusyId] = useState<string | null>(null);

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

  const count = (s: string) => orders.filter((o) => o.status === s).length;
  const money = (n: number) => `$${Number(n).toLocaleString()}`;

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
        customer_name: order.customer_name || order.notes?.split("\n")[0]?.trim() || "Customer",
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

  const submit = () => {
    const car = realCars.find((c) => c.id === form.carId);
    createOrder.mutate({
      customer_name: form.customer_name || "Walk-in customer",
      phone: form.phone,
      status: form.status,
      total_amount: form.total !== "" ? Number(form.total) : (car ? car.price : 0),
      notes: form.notes,
      items: car ? [{ car_id: car.id, car_name: car.name, price: car.price }] : [],
    }, {
      onSuccess: () => { setOpen(false); setForm({ customer_name: "", phone: "", carId: "", total: "", status: "pending", notes: "" }); },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin.orders.title")}</h1>
          <p className="text-muted-foreground">{t("admin.orders.subtitle")}</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Order</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[["Total Orders", orders.length], ["Pending", count("pending")], ["Processing", count("processing")], ["Completed", count("completed") + count("delivered")]].map(([l, v]) => (
          <Card key={l as string}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{l}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{v as number}</div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />All Orders</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No orders yet</p>
              <Button className="mt-4" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Create first order</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Items</TableHead>
                  <TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Update</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">
                        {o.customer_name || o.notes?.split("\n")[0]?.trim() || "—"}
                        <div className="text-xs text-muted-foreground">{o.phone}</div>
                        {o.notes?.includes("Telegram:") && (
                          <div className="text-xs text-[#229ED9]">
                            {o.notes.split("\n").find((l) => l.startsWith("Telegram:"))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{o.order_items?.length ? o.order_items.map((i) => i.car_name || i.car_id || "Car").join(", ") : (o.notes || "—")}</TableCell>
                      <TableCell className="font-semibold">{money(o.total_amount)}</TableCell>
                      <TableCell><Badge variant={statusVariant(o.status)}>{o.status}</Badge></TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}>
                          <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
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
                          <Button size="sm" variant="destructive" onClick={() => deleteOrder.mutate(o.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Order</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Customer name</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Customer name" /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+\-\s()]/g, "") })} placeholder="0xx xxx xxx" /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Car</Label>
              <Select value={form.carId} onValueChange={pickCar}>
                <SelectTrigger><SelectValue placeholder="Select a car" /></SelectTrigger>
                <SelectContent>{realCars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — ${c.price.toLocaleString()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Total ($)</Label><Input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} placeholder="0" /></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Notes (optional)</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={createOrder.isPending}>{createOrder.isPending ? "Saving..." : "Create order"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
