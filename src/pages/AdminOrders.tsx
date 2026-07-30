import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCars } from "@/hooks/useCars";
import {
  useAdminOrders, useUpdateOrderStatus, useCreateOrder, useDeleteOrder, ORDER_STATUSES,
} from "@/hooks/useAdminOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Plus, Trash2, Package } from "lucide-react";

const statusVariant = (s: string): "default" | "secondary" | "outline" | "destructive" =>
  s === "completed" || s === "delivered" ? "default"
    : s === "cancelled" ? "destructive"
    : s === "pending" ? "outline" : "secondary";

const AdminOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { data: orders = [], isLoading } = useAdminOrders();
  const { data: cars = [] } = useCars();
  const updateStatus = useUpdateOrderStatus();
  const createOrder = useCreateOrder();
  const deleteOrder = useDeleteOrder();

  const realCars = cars.filter((c) => !String(c.id).startsWith("mock-"));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: "", phone: "", carId: "", total: "", status: "pending", notes: "" });

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

  const count = (s: string) => orders.filter((o) => o.status === s).length;
  const money = (n: number) => `$${Number(n).toLocaleString()}`;

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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />Back to Admin
          </Link>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Order Management</h1>
              <p className="text-muted-foreground">View and manage customer orders</p>
            </div>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Order</Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                          <TableCell className="font-medium">{o.customer_name || "—"}<div className="text-xs text-muted-foreground">{o.phone}</div></TableCell>
                          <TableCell className="text-sm">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm">{o.order_items?.length ? o.order_items.map((i) => i.car_name).join(", ") : "—"}</TableCell>
                          <TableCell className="font-semibold">{money(o.total_amount)}</TableCell>
                          <TableCell><Badge variant={statusVariant(o.status)}>{o.status}</Badge></TableCell>
                          <TableCell>
                            <Select value={o.status} onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}>
                              <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                              <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="destructive" onClick={() => deleteOrder.mutate(o.id)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

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
