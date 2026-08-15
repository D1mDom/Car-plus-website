import { useMemo, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useCars } from "@/hooks/useCars";
import { useContact, DEFAULT_CONTACT } from "@/hooks/useContact";
import {
  useReceipts,
  useCreateReceipt,
  useUpdateReceipt,
  useDeleteReceipt,
  receiptGrandTotal,
  type PaymentMethod,
  type Receipt,
} from "@/hooks/useReceipts";
import { printReceipt, type ReceiptPrintLabels } from "@/components/admin/receiptPrint";
import ReceiptInvoicePreview from "@/components/admin/ReceiptInvoicePreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { FileText, Loader2, Plus, Printer, Trash2, Eye, Pencil, X, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { formatPhoneDisplay, cleanPhoneInput } from "@/lib/phoneUtils";
import { cn } from "@/lib/utils";

const PAYMENTS: PaymentMethod[] = ["cash", "transfer", "card", "other"];

type FormState = {
  customer_name: string;
  phone: string;
  carId: string;
  description: string;
  car_code: string;
  year: string;
  make: string;
  model: string;
  unit_price: string;
  qty: string;
  tax_rate: string;
  payment_method: PaymentMethod;
  payment_stage: "quote" | "deposit" | "balance" | "paid";
  bank_name: string;
  account_no: string;
  notes: string;
};

const emptyForm = (): FormState => ({
  customer_name: "",
  phone: "",
  carId: "",
  description: "",
  car_code: "",
  year: "",
  make: "",
  model: "",
  unit_price: "",
  qty: "1",
  tax_rate: "0",
  payment_method: "cash",
  payment_stage: "quote",
  bank_name: "ABA Bank",
  account_no: "",
  notes: "",
});

const receiptToForm = (r: Receipt): FormState => ({
  customer_name: r.customer_name || "",
  phone: r.phone || "",
  carId: "__custom__",
  description: r.description || r.car_name || "",
  car_code: r.car_code || "",
  year: r.year || "",
  make: r.make || "",
  model: r.model || "",
  unit_price: String(r.unit_price ?? r.amount ?? ""),
  qty: String(r.qty || 1),
  tax_rate: String(r.tax_rate || 0),
  payment_method: r.payment_method || "cash",
  payment_stage: "paid",
  bank_name: r.bank_name || "ABA Bank",
  account_no: r.account_no || "",
  notes: r.notes || "",
});

const AdminReceipts = () => {
  const { t } = useLanguage();
  const { data: receipts = [], isLoading } = useReceipts();
  const { data: cars = [] } = useCars();
  const { data: contact = DEFAULT_CONTACT } = useContact();
  const createReceipt = useCreateReceipt();
  const updateReceipt = useUpdateReceipt();
  const deleteReceipt = useDeleteReceipt();

  const realCars = cars.filter((c) => !String(c.id).startsWith("mock-"));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [preview, setPreview] = useState<Receipt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [wizardStep, setWizardStep] = useState(0);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const labels: ReceiptPrintLabels = useMemo(
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

  const money = (n: number) => `$${Number(n || 0).toLocaleString()}`;
  const saving = createReceipt.isPending || updateReceipt.isPending;

  const filteredReceipts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return receipts.filter((r) => {
      if (paymentFilter !== "all" && r.payment_method !== paymentFilter) return false;
      if (q) {
        const hay = `${r.customer_name ?? ""} ${r.phone ?? ""} ${r.receipt_no ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [receipts, search, paymentFilter]);

  const hasFilters = search.trim() !== "" || paymentFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setPaymentFilter("all");
  };

  const openCreate = () => {
    setEditing(null);
    setWizardStep(0);
    setForm({ ...emptyForm(), account_no: contact.phone || "" });
    setFormOpen(true);
  };

  const openEdit = (r: Receipt) => {
    setEditing(r);
    setWizardStep(0);
    setForm(receiptToForm(r));
    setFormOpen(true);
    setPreview(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setWizardStep(0);
  };

  const wizardSteps = [
    t("admin.receipts.wizard.step1"),
    t("admin.receipts.wizard.step2"),
    t("admin.receipts.wizard.step3"),
    t("admin.receipts.wizard.step4"),
  ];

  const paymentStages = [
    { value: "quote" as const, label: t("admin.receipts.paymentStep.quote") },
    { value: "deposit" as const, label: t("admin.receipts.paymentStep.deposit") },
    { value: "balance" as const, label: t("admin.receipts.paymentStep.balance") },
    { value: "paid" as const, label: t("admin.receipts.paymentStep.paid") },
  ];

  const canNextStep = () => {
    if (wizardStep === 0) return form.customer_name.trim().length >= 2;
    if (wizardStep === 1) return form.unit_price !== "" && Number(form.unit_price) > 0;
    return true;
  };

  const grandPreview = () => {
    const unit = form.unit_price !== "" ? Number(form.unit_price) : 0;
    const qty = form.qty !== "" ? Number(form.qty) : 1;
    const tax = form.tax_rate !== "" ? Number(form.tax_rate) : 0;
    return unit * qty * (1 + tax / 100);
  };

  const pickCar = (carId: string) => {
    if (carId === "__custom__") {
      setForm((f) => ({
        ...f,
        carId,
        description: "",
        car_code: "",
        year: "",
        make: "",
        model: "",
      }));
      return;
    }
    const car = realCars.find((c) => c.id === carId);
    if (!car) return;
    const make = car.name.split(" ")[0] || "";
    setForm((f) => ({
      ...f,
      carId,
      description: car.name,
      car_code: car.code || "",
      year: String(car.year || ""),
      make,
      model: car.model || "",
      unit_price: String(car.price),
    }));
  };

  const submit = () => {
    if (!form.customer_name.trim()) return;
    const unit_price = form.unit_price !== "" ? Number(form.unit_price) : 0;
    const qty = form.qty !== "" ? Number(form.qty) : 1;
    const payload = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      description: form.description.trim() || undefined,
      car_name: form.description.trim() || undefined,
      car_code: form.car_code.trim() || undefined,
      year: form.year.trim() || undefined,
      make: form.make.trim() || undefined,
      model: form.model.trim() || undefined,
      unit_price,
      qty,
      tax_rate: form.tax_rate !== "" ? Number(form.tax_rate) : 0,
      payment_method: form.payment_method,
      bank_name: form.bank_name.trim() || undefined,
      account_no: form.account_no.trim() || undefined,
      notes: [
        form.payment_stage !== "quote" ? `[${form.payment_stage}]` : "",
        form.notes.trim(),
      ].filter(Boolean).join(" ") || undefined,
    };

    if (editing) {
      updateReceipt.mutate(
        { id: editing.id, ...payload },
        {
          onSuccess: (receipt) => {
            closeForm();
            setPreview(receipt);
          },
        }
      );
      return;
    }

    createReceipt.mutate(payload, {
      onSuccess: (receipt) => {
        closeForm();
        setForm(emptyForm());
        setPreview(receipt);
      },
    });
  };

  const handlePrint = (receipt: Receipt) => {
    void printReceipt(receipt, contact, labels);
  };

  const rowActions = (r: Receipt) => (
    <div className="flex justify-end gap-1.5">
      <Button size="sm" variant="outline" onClick={() => setPreview(r)} title={t("admin.receipts.view")}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => openEdit(r)} title={t("admin.receipts.edit")}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => handlePrint(r)} title={t("admin.receipts.print")}>
        <Printer className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setDeleteId(r.id)} title={t("admin.receipts.delete")}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={openCreate} className="gap-1.5 transition-transform active:scale-95">
          <Plus className="h-4 w-4" />
          {t("admin.receipts.create")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="admin-card-hover border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.receipts.statTotal")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
          </CardContent>
        </Card>
        <Card className="admin-card-hover border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.receipts.statAmount")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {money(receipts.reduce((sum, r) => sum + receiptGrandTotal(r), 0))}
            </div>
          </CardContent>
        </Card>
        <Card className="admin-card-hover border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.receipts.statToday")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                receipts.filter((r) => {
                  const d = new Date(r.issued_at);
                  const now = new Date();
                  return d.toDateString() === now.toDateString();
                }).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-[#174080]" />
              {t("admin.receipts.list")}
            </CardTitle>
            {receipts.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {filteredReceipts.length} {t("admin.common.results")}
              </p>
            ) : null}
          </div>
          {receipts.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.receipts.search")}
                className="sm:max-w-xs"
              />
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder={t("admin.receipts.filterPayment")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.receipts.filterAll")}</SelectItem>
                  {PAYMENTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {labels.paymentMethods[p]}
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
          ) : receipts.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>{t("admin.receipts.empty")}</p>
              <Button className="mt-4 gap-1.5" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t("admin.receipts.createFirst")}
              </Button>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>{t("admin.receipts.noResults")}</p>
              <Button variant="outline" className="mt-4 gap-1.5" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                {t("admin.filter.clear")}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {filteredReceipts.map((r) => (
                  <div key={r.id} className="space-y-2 rounded-xl border border-border/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium">{r.receipt_no}</div>
                        <div className="text-sm">{r.customer_name}</div>
                        {r.phone ? <div className="text-xs text-muted-foreground">{r.phone}</div> : null}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{money(receiptGrandTotal(r))}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.issued_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {r.description || r.car_name || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {labels.paymentMethods[r.payment_method] || r.payment_method}
                    </div>
                    {rowActions(r)}
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.receipts.no")}</TableHead>
                      <TableHead>{t("admin.receipts.customer")}</TableHead>
                      <TableHead>{t("admin.receipts.description")}</TableHead>
                      <TableHead>{t("admin.receipts.payment")}</TableHead>
                      <TableHead>{t("admin.receipts.grandTotal")}</TableHead>
                      <TableHead>{t("admin.receipts.date")}</TableHead>
                      <TableHead className="text-right">{t("admin.receipts.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceipts.map((r) => (
                      <TableRow key={r.id} className="transition-colors hover:bg-muted/50">
                        <TableCell className="font-medium">{r.receipt_no}</TableCell>
                        <TableCell>
                          {r.customer_name}
                          {r.phone ? <div className="text-xs text-muted-foreground">{r.phone}</div> : null}
                        </TableCell>
                        <TableCell className="text-sm">{r.description || r.car_name || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {labels.paymentMethods[r.payment_method] || r.payment_method}
                        </TableCell>
                        <TableCell className="font-semibold">{money(receiptGrandTotal(r))}</TableCell>
                        <TableCell className="text-sm">{new Date(r.issued_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{rowActions(r)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
          else setFormOpen(true);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("admin.receipts.edit") : t("admin.receipts.create")}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <p className="text-xs text-muted-foreground">
              {t("admin.receipts.no")}: <span className="font-medium text-foreground">{editing.receipt_no}</span>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {wizardSteps.map((label, idx) => (
                <span
                  key={label}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                    idx === wizardStep
                      ? "bg-[#174080] text-white"
                      : idx < wizardStep
                        ? "bg-emerald-500/12 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {idx < wizardStep ? <CheckCircle2 className="h-3 w-3" /> : null}
                  {idx + 1}. {label}
                </span>
              ))}
            </div>
          )}

          {wizardStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("admin.receipts.invoiceTo")} *</Label>
                  <Input
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    placeholder={t("admin.receipts.customer")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("admin.receipts.phone")}</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: formatPhoneDisplay(cleanPhoneInput(e.target.value)) })
                    }
                    placeholder="016 600 090"
                  />
                </div>
              </div>
            </div>
          )}

          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("admin.receipts.selectCar")}</Label>
                <Select value={form.carId || undefined} onValueChange={pickCar}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.receipts.selectCar")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__custom__">{t("admin.receipts.customItem")}</SelectItem>
                    {realCars.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — ${c.price.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.receipts.description")}</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("admin.receipts.price")} ($)</Label>
                  <Input
                    type="number"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("admin.receipts.qty")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("admin.receipts.tax")} %</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.tax_rate}
                    onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("admin.receipts.payment")} — step by step</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {paymentStages.map((stage, idx) => (
                    <button
                      key={stage.value}
                      type="button"
                      onClick={() => setForm({ ...form, payment_stage: stage.value })}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                        form.payment_stage === stage.value
                          ? "border-[#174080] bg-[#174080]/10 text-[#174080]"
                          : "border-border hover:border-[#174080]/30",
                      )}
                    >
                      <span className="font-semibold">{idx + 1}.</span> {stage.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("admin.receipts.payment")}</Label>
                  <Select
                    value={form.payment_method}
                    onValueChange={(v) => setForm({ ...form, payment_method: v as PaymentMethod })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENTS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {labels.paymentMethods[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("admin.receipts.bankName")}</Label>
                  <Input
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.receipts.accountNo")}</Label>
                <Input
                  value={form.account_no}
                  onChange={(e) => setForm({ ...form, account_no: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.receipts.notes")}</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
              <p className="text-xs text-muted-foreground">{t("admin.receipts.wizard.reviewHint")}</p>
              <div><span className="text-muted-foreground">{t("admin.receipts.customer")}:</span> {form.customer_name}</div>
              {form.phone ? <div><span className="text-muted-foreground">{t("admin.receipts.phone")}:</span> {form.phone}</div> : null}
              <div><span className="text-muted-foreground">{t("admin.receipts.description")}:</span> {form.description || "—"}</div>
              <div><span className="text-muted-foreground">{t("admin.receipts.grandTotal")}:</span> {money(grandPreview())}</div>
              <div><span className="text-muted-foreground">{t("admin.receipts.payment")}:</span> {labels.paymentMethods[form.payment_method]} · {paymentStages.find((s) => s.value === form.payment_stage)?.label}</div>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => (wizardStep === 0 ? closeForm() : setWizardStep((s) => s - 1))}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              {wizardStep === 0 ? t("form.cancel") : t("admin.receipts.wizard.back")}
            </Button>
            {wizardStep < wizardSteps.length - 1 ? (
              <Button
                type="button"
                onClick={() => setWizardStep((s) => s + 1)}
                disabled={!canNextStep()}
                className="gap-1.5"
              >
                {t("admin.receipts.wizard.next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={!form.customer_name.trim() || saving}>
                {saving ? t("form.saving") : editing ? t("admin.receipts.update") : t("admin.receipts.save")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("admin.receipts.preview")}</DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="space-y-3">
              <ReceiptInvoicePreview receipt={preview} contact={contact} labels={labels} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => setPreview(null)}>
                  {t("form.cancel")}
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={() => openEdit(preview)}>
                  <Pencil className="h-4 w-4" />
                  {t("admin.receipts.edit")}
                </Button>
                <Button className="gap-1.5" onClick={() => void handlePrint(preview)}>
                  <Printer className="h-4 w-4" />
                  {t("admin.receipts.printPdf")}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.receipts.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.receipts.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("form.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteReceipt.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              {t("admin.receipts.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReceipts;
