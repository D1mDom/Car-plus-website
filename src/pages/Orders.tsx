import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  useMyOrders,
  useUpdateMyOrder,
  useDeleteMyOrder,
  parseOrderNotes,
  type MyOrder,
} from "@/hooks/useMyOrders";
import { useCars } from "@/hooks/useCars";
import { useContact } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Package,
  CalendarDays,
  Hash,
  Car,
  ArrowRight,
  Pencil,
  Trash2,
  Phone,
  Send,
  ExternalLink,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { onImgError } from "@/lib/imageFallback";
import type { TranslationKey } from "@/i18n/translations";

type FilterKey = "all" | "pending" | "active" | "done";

const statusStyle = (s: string) => {
  switch (s) {
    case "completed":
    case "delivered":
      return "bg-emerald-500/12 text-emerald-700 border-emerald-500/25";
    case "cancelled":
      return "bg-red-500/12 text-red-700 border-red-500/25";
    case "pending":
      return "bg-amber-500/12 text-amber-800 border-amber-500/25";
    case "processing":
    case "confirmed":
      return "bg-sky-500/12 text-sky-700 border-sky-500/25";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const Orders = () => {
  const { user, loading } = useAuth();
  const { data: orders = [], isLoading } = useMyOrders();
  const { data: cars = [] } = useCars();
  const { data: contact } = useContact();
  const { t } = useLanguage();
  const updateOrder = useUpdateMyOrder();
  const deleteOrder = useDeleteMyOrder();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [editOrder, setEditOrder] = useState<MyOrder | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);

  const shopTelegram = (contact?.telegram || "@Carplus777").replace(/^@/, "");
  const shopPhone = contact?.phone || "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(210_28%_97%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#174080]" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const findCar = (carId: string | null | undefined) =>
    cars.find((c) => String(c.id) === String(carId));

  const money = (n: number) => `$${Number(n).toLocaleString()}`;
  const statusLabel = (s: string) => t(`orders.status.${s}` as TranslationKey);

  const carLabel = (o: MyOrder) => {
    if (o.order_items?.length) {
      return o.order_items
        .map((i) => i.car_name || findCar(i.car_id)?.name || i.car_id || "Car")
        .join(", ");
    }
    return parseOrderNotes(o.notes).carName
      || o.notes?.split("·").pop()?.trim()
      || "—";
  };

  const carImage = (o: MyOrder) => {
    const item = o.order_items?.[0];
    if (!item?.car_id) return null;
    const car = findCar(item.car_id);
    return car?.image || car?.images?.[0] || null;
  };

  const openEdit = (o: MyOrder) => {
    const parsed = parseOrderNotes(o.notes);
    const fromNotesName = o.notes?.split("\n")[0]?.trim();
    setName(
      o.customer_name
        || (fromNotesName && !fromNotesName.startsWith("Car:") ? fromNotesName : "")
        || ""
    );
    setPhone(o.phone ?? "");
    setTelegram(parsed.telegram);
    setPreferredTime(parsed.preferredTime);
    setNote(parsed.note);
    setTouched(false);
    setEditOrder(o);
  };

  const cleanPhone = (v: string) => v.replace(/[^0-9+\-\s()]/g, "");
  const nameOk = name.trim().length >= 2;
  const phoneOk = phone.trim().replace(/[^0-9]/g, "").length >= 8;

  const saveEdit = () => {
    setTouched(true);
    if (!editOrder || !nameOk || !phoneOk) return;
    const parsed = parseOrderNotes(editOrder.notes);
    updateOrder.mutate(
      {
        id: editOrder.id,
        customerName: name.trim(),
        phone: phone.trim(),
        telegram: telegram.trim() || undefined,
        preferredTime: preferredTime || undefined,
        note: note.trim() || undefined,
        carName: parsed.carName || carLabel(editOrder),
      },
      { onSuccess: () => setEditOrder(null) }
    );
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteOrder.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const activeCount = orders.filter((o) =>
    ["confirmed", "processing"].includes(o.status)
  ).length;
  const doneCount = orders.filter((o) =>
    ["completed", "delivered"].includes(o.status)
  ).length;

  const filtered = orders.filter((o) => {
    if (filter === "pending") return o.status === "pending";
    if (filter === "active") return ["confirmed", "processing"].includes(o.status);
    if (filter === "done") return ["completed", "delivered"].includes(o.status);
    return true;
  });

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: t("orders.filterAll"), count: orders.length },
    { key: "pending", label: t("orders.pendingLabel"), count: pendingCount },
    { key: "active", label: t("orders.filterActive"), count: activeCount },
    { key: "done", label: t("orders.filterDone"), count: doneCount },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(210_28%_97%)] dark:bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero — sits below sticky header */}
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,hsl(216_50%_14%),hsl(199_50%_26%))]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 60% at 10% 0%, hsl(217 70% 30% / 0.28), transparent 50%), radial-gradient(ellipse 50% 40% at 95% 30%, hsl(199 90% 55% / 0.18), transparent 45%)",
            }}
          />
          <div className="container relative mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                  Car Plus
                </p>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {t("orders.title")}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-white/75 sm:text-base">
                  {t("orders.subtitle")}
                </p>
                <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-white/60 sm:text-sm">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
                  {t("orders.pageHint")}
                </p>
              </div>

              {!isLoading && (
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto lg:min-w-[420px]">
                  {[
                    { label: t("orders.totalLabel"), value: orders.length, icon: Package },
                    { label: t("orders.pendingLabel"), value: pendingCount, icon: Clock3 },
                    { label: t("orders.filterActive"), value: activeCount, icon: Car },
                    { label: t("orders.filterDone"), value: doneCount, icon: CheckCircle2 },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl border border-white/12 bg-white/10 px-3 py-3 backdrop-blur-sm"
                    >
                      <div className="mb-1 flex items-center justify-between text-white/65">
                        <span className="text-[10px] font-medium sm:text-[11px]">{s.label}</span>
                        <s.icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="font-heading text-xl font-bold text-white sm:text-2xl">{s.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
          {/* Filters */}
          {!isLoading && orders.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition-colors",
                    filter === f.key
                      ? "border-[#174080] bg-[#174080] text-white"
                      : "border-border/80 bg-card text-foreground hover:border-[#174080]/35"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      filter === f.key ? "bg-white/20" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#174080]" />
            </div>
          ) : orders.length === 0 ? (
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
              <div className="grid md:grid-cols-2">
                <div className="flex flex-col justify-center px-8 py-12 sm:px-10">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#174080]/10 text-[#174080]">
                    <Package className="h-7 w-7" />
                  </span>
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    {t("orders.empty")}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{t("orders.emptyHint")}</p>
                  <Button asChild className="mt-6 w-fit gap-2 bg-[#174080] hover:bg-[#143871]">
                    <Link to="/cars">
                      {t("orders.browse")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="relative hidden min-h-[240px] bg-[linear-gradient(145deg,hsl(216_40%_20%),hsl(199_45%_30%))] md:block">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Car className="h-24 w-24 text-white/20" />
                  </div>
                </div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/80 px-6 py-14 text-center">
              <p className="text-muted-foreground">{t("orders.filterEmpty")}</p>
              <Button type="button" variant="outline" className="mt-4" onClick={() => setFilter("all")}>
                {t("orders.filterAll")}
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {filtered.map((o) => {
                const image = carImage(o);
                const title = carLabel(o);
                const firstCarId = o.order_items?.[0]?.car_id;
                const canManage = o.status === "pending";
                const parsed = parseOrderNotes(o.notes);
                const tg = parsed.telegram;

                return (
                  <li
                    key={o.id}
                    className="group overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#174080]/28 hover:shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Fixed-height image column (was collapsing on desktop) */}
                      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-muted sm:h-auto sm:min-h-[11.5rem] sm:w-52 md:w-64">
                        {image ? (
                          firstCarId ? (
                            <Link to={`/car/${firstCarId}`} className="absolute inset-0 block sm:relative sm:h-full sm:min-h-[11.5rem]">
                              <img
                                src={image}
                                alt={title}
                                onError={onImgError}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] sm:absolute sm:inset-0"
                              />
                            </Link>
                          ) : (
                            <img
                              src={image}
                              alt={title}
                              onError={onImgError}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          )
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#174080]/8 text-[#174080]">
                            <Car className="h-10 w-10" />
                            <span className="text-xs font-medium opacity-70">{t("orders.noPhoto")}</span>
                          </div>
                        )}
                        <span
                          className={cn(
                            "absolute left-3 top-3 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-md sm:hidden",
                            statusStyle(o.status)
                          )}
                        >
                          {statusLabel(o.status)}
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="mb-1.5 hidden sm:block">
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                                  statusStyle(o.status)
                                )}
                              >
                                {statusLabel(o.status)}
                              </span>
                            </div>
                            <h2 className="font-heading text-lg font-bold leading-snug text-foreground md:text-xl">
                              {title}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {new Date(o.created_at).toLocaleDateString()}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Hash className="h-3.5 w-3.5" />
                                {t("orders.number")} #{o.id.slice(0, 8)}
                              </span>
                            </div>
                            {(o.phone || tg || parsed.note) && (
                              <div className="mt-2.5 space-y-1">
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  {o.phone && (
                                    <span className="inline-flex items-center gap-1">
                                      <Phone className="h-3.5 w-3.5 text-[#174080]" />
                                      {o.phone}
                                    </span>
                                  )}
                                  {tg && (
                                    <span className="inline-flex items-center gap-1">
                                      <Send className="h-3.5 w-3.5 text-[#229ED9]" />
                                      @{tg.replace(/^@/, "")}
                                    </span>
                                  )}
                                </div>
                                {parsed.note && (
                                  <p className="line-clamp-2 text-xs text-muted-foreground">
                                    {parsed.note}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl bg-muted/50 px-4 py-2.5 text-left sm:min-w-[7.5rem] sm:text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {t("orders.priceLabel")}
                            </p>
                            <p className="font-heading text-2xl font-bold tracking-tight text-foreground">
                              {money(o.total_amount)}
                            </p>
                          </div>
                        </div>

                        {/* Simple status steps */}
                        <div className="hidden items-center gap-1.5 md:flex">
                          {["pending", "confirmed", "completed"].map((step, idx) => {
                            const done =
                              (step === "pending" && ["pending", "confirmed", "processing", "delivered", "completed"].includes(o.status))
                              || (step === "confirmed" && ["confirmed", "processing", "delivered", "completed"].includes(o.status))
                              || (step === "completed" && ["delivered", "completed"].includes(o.status));
                            const current =
                              (step === "pending" && o.status === "pending")
                              || (step === "confirmed" && ["confirmed", "processing"].includes(o.status))
                              || (step === "completed" && ["delivered", "completed"].includes(o.status));
                            return (
                              <div key={step} className="flex items-center gap-1.5">
                                {idx > 0 && (
                                  <div className={cn("h-px w-6", done ? "bg-[#174080]" : "bg-border")} />
                                )}
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                    current
                                      ? "bg-[#174080]/12 text-[#143871]"
                                      : done
                                        ? "text-emerald-700"
                                        : "text-muted-foreground/60"
                                  )}
                                >
                                  {done ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                                  {t(`orders.step.${step}` as TranslationKey)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                          {firstCarId && (
                            <Button asChild size="sm" variant="outline" className="h-9 gap-1.5">
                              <Link to={`/car/${firstCarId}`}>
                                <ExternalLink className="h-3.5 w-3.5" />
                                {t("orders.viewCar")}
                              </Link>
                            </Button>
                          )}
                          {canManage && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 gap-1.5"
                                onClick={() => openEdit(o)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                {t("orders.edit")}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="h-9 gap-1.5"
                                onClick={() => setDeleteId(o.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {t("orders.delete")}
                              </Button>
                            </>
                          )}
                          {o.status === "pending" && (
                            <p className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto">
                              {t("orders.pendingHint")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Help strip — completes the page */}
          <div className="mt-10 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
            <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
              <div className="px-6 py-7 sm:px-8">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {t("orders.helpTitle")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("orders.helpBody")}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild className="gap-2 bg-[#229ED9] hover:bg-[#1b8ec4]">
                    <a href={`https://t.me/${shopTelegram}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      Telegram
                    </a>
                  </Button>
                  {shopPhone && (
                    <Button asChild variant="outline" className="gap-2">
                      <a href={`tel:${shopPhone.replace(/\s+/g, "")}`}>
                        <Phone className="h-4 w-4" />
                        {shopPhone}
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="ghost" className="gap-2">
                    <Link to="/cars">
                      {t("orders.browse")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="border-t border-border/60 bg-[linear-gradient(145deg,hsl(216_40%_18%),hsl(199_42%_28%))] px-6 py-7 text-white sm:px-8 md:border-l md:border-t-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                  {t("orders.processTitle")}
                </p>
                <ol className="mt-4 space-y-3 text-sm text-white/85">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">1</span>
                    {t("orders.process1")}
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">2</span>
                    {t("orders.process2")}
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">3</span>
                    {t("orders.process3")}
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={!!editOrder} onOpenChange={(o) => { if (!o) setEditOrder(null); }}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("orders.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {editOrder && (
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium">
                {carLabel(editOrder)}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">{t("order.dialog.nameLabel")}</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
              {touched && !nameOk && (
                <p className="text-xs text-destructive">{t("order.dialog.nameInvalid")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">{t("order.dialog.phoneLabel")}</Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(cleanPhone(e.target.value))}
              />
              {touched && !phoneOk && (
                <p className="text-xs text-destructive">{t("order.dialog.phoneInvalid")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-telegram">
                {t("order.dialog.telegramLabel")}
                <span className="ml-1 font-normal text-muted-foreground">
                  ({t("order.dialog.optional")})
                </span>
              </Label>
              <Input
                id="edit-telegram"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value.replace(/\s/g, ""))}
                placeholder="@username"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {t("order.dialog.timeLabel")}
                <span className="ml-1 font-normal text-muted-foreground">
                  ({t("order.dialog.optional")})
                </span>
              </Label>
              <Select value={preferredTime || undefined} onValueChange={setPreferredTime}>
                <SelectTrigger>
                  <SelectValue placeholder={t("order.dialog.timePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">{t("order.dialog.timeMorning")}</SelectItem>
                  <SelectItem value="afternoon">{t("order.dialog.timeAfternoon")}</SelectItem>
                  <SelectItem value="evening">{t("order.dialog.timeEvening")}</SelectItem>
                  <SelectItem value="anytime">{t("order.dialog.timeAnytime")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-note">
                {t("order.dialog.noteLabel")}
                <span className="ml-1 font-normal text-muted-foreground">
                  ({t("order.dialog.optional")})
                </span>
              </Label>
              <Textarea
                id="edit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditOrder(null)}>
                {t("auth.cancel")}
              </Button>
              <Button onClick={saveEdit} disabled={updateOrder.isPending}>
                {updateOrder.isPending ? t("form.saving") : t("form.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("orders.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("orders.deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auth.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrder.isPending ? t("form.saving") : t("orders.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orders;
