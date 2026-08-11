import { useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useCars, useDeleteCar } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { useCountUp } from "@/hooks/useCountUp";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  Car,
  Loader2,
  Download,
  Upload,
  Sparkles,
  CircleDollarSign,
  BadgeCheck,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import CarFormDialog from "@/components/admin/CarFormDialog";
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
import type { Car as CarType } from "@/hooks/useCars";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const CAR_STATUSES = ["ready", "onroad", "luxury", "plate"] as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  prefix = "",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
  prefix?: string;
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
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          {prefix}
          {n.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

const Admin = () => {
  const { t } = useLanguage();
  const { data: cars, isLoading: carsLoading } = useCars();
  const deleteCar = useDeleteCar();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleFilter, setVisibleFilter] = useState("all");
  const importInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const handleBackup = async () => {
    try {
      const [carsRes, teamRes, bannersRes, contactRes] = await Promise.all([
        supabase.from("cars").select("*"),
        db.from("team_members").select("*"),
        db.from("banners").select("*"),
        db.from("contact_info").select("*").eq("id", 1).maybeSingle(),
      ]);
      const backup = {
        exported_at: new Date().toISOString(),
        version: 1,
        cars: carsRes.data ?? [],
        team_members: teamRes.data ?? [],
        banners: bannersRes.data ?? [],
        contact_info: contactRes.data ?? null,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carplus-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (err) {
      toast.error("Backup failed: " + (err instanceof Error ? err.message : "error"));
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const backup = JSON.parse(await file.text());
      const fail = (e: unknown) => {
        if (e) throw e;
      };

      if (Array.isArray(backup.cars) && backup.cars.length) {
        fail((await supabase.from("cars").upsert(backup.cars, { onConflict: "id" })).error);
      }
      if (Array.isArray(backup.team_members) && backup.team_members.length) {
        fail((await db.from("team_members").upsert(backup.team_members, { onConflict: "id" })).error);
      }
      if (Array.isArray(backup.banners) && backup.banners.length) {
        fail((await db.from("banners").upsert(backup.banners, { onConflict: "id" })).error);
      }
      if (backup.contact_info) {
        const { id: _id, ...contact } = backup.contact_info;
        fail((await db.from("contact_info").update(contact).eq("id", 1)).error);
      }

      queryClient.invalidateQueries();
      toast.success("Data imported successfully");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Invalid backup file";
      toast.error("Import failed: " + msg);
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleEdit = (car: CarType) => {
    setEditingCar(car);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setCarToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (carToDelete) {
      deleteCar.mutate(carToDelete);
      setDeleteDialogOpen(false);
      setCarToDelete(null);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingCar(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      ready: "default",
      onroad: "secondary",
      luxury: "outline",
      plate: "destructive",
    };
    const key = `status.${status}` as TranslationKey;
    return <Badge variant={variants[status] || "default"}>{t(key)}</Badge>;
  };

  const realCars = useMemo(
    () => (cars ?? []).filter((c) => !String(c.id).startsWith("mock-")),
    [cars]
  );
  const totalValue = realCars.reduce((sum, c) => sum + c.price, 0);

  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    return realCars.filter((car) => {
      if (q) {
        const hay = `${car.name} ${car.code ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== "all" && car.status !== statusFilter) return false;
      if (visibleFilter === "visible" && !car.isActive) return false;
      if (visibleFilter === "hidden" && car.isActive) return false;
      return true;
    });
  }, [realCars, search, statusFilter, visibleFilter]);

  const hasFilters = search.trim() !== "" || statusFilter !== "all" || visibleFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setVisibleFilter("all");
  };

  const carActions = (car: CarType) => (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        className="transition-transform active:scale-90"
        onClick={() => handleEdit(car)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="transition-transform active:scale-90"
        onClick={() => handleDelete(car.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" className="transition-transform active:scale-95" onClick={handleBackup}>
          <Download className="mr-2 h-4 w-4" />
          {t("admin.cars.backup")}
        </Button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleImport(e.target.files[0]);
          }}
        />
        <Button
          variant="outline"
          className="transition-transform active:scale-95"
          onClick={() => importInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {t("admin.cars.import")}
        </Button>
        <Button asChild className="transition-transform active:scale-95">
          <Link to="/admin/add-car">
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.cars.add")}
          </Link>
        </Button>
      </div>

      <div className="admin-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("admin.cars.total")}
          value={realCars.length}
          icon={Car}
          tone="text-[#174080] bg-[#174080]/12"
        />
        <StatCard
          label={t("admin.cars.ready")}
          value={realCars.filter((c) => c.status === "ready").length}
          icon={BadgeCheck}
          tone="text-emerald-600 bg-emerald-500/10"
        />
        <StatCard
          label={t("admin.cars.luxury")}
          value={realCars.filter((c) => c.status === "luxury").length}
          icon={Sparkles}
          tone="text-amber-600 bg-amber-500/10"
        />
        <StatCard
          label={t("admin.cars.value")}
          value={totalValue}
          icon={CircleDollarSign}
          tone="text-sky-600 bg-sky-500/10"
          prefix="$"
        />
      </div>

      <Card className="animate-admin-pop border-border/70 shadow-sm" style={{ animationDelay: "0.2s" }}>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-[#174080]" />
              {t("admin.cars.list")}
            </CardTitle>
            {realCars.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {filteredCars.length} {t("admin.common.results")}
              </p>
            ) : null}
          </div>
          {realCars.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.cars.search")}
                className="sm:max-w-xs"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-[160px]">
                  <SelectValue placeholder={t("admin.cars.filterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.cars.filterAll")}</SelectItem>
                  {CAR_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`status.${s}` as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={visibleFilter} onValueChange={setVisibleFilter}>
                <SelectTrigger className="sm:w-[160px]">
                  <SelectValue placeholder={t("admin.cars.filterVisible")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.cars.filterAll")}</SelectItem>
                  <SelectItem value="visible">{t("admin.cars.visible")}</SelectItem>
                  <SelectItem value="hidden">{t("admin.cars.hidden")}</SelectItem>
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
          {carsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : realCars.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Car className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>{t("admin.cars.empty")}</p>
              <Button asChild className="mt-4 gap-1.5">
                <Link to="/admin/add-car">
                  <Plus className="h-4 w-4" />
                  {t("admin.cars.addFirst")}
                </Link>
              </Button>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>{t("admin.cars.noResults")}</p>
              <Button variant="outline" className="mt-4 gap-1.5" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                {t("admin.filter.clear")}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {filteredCars.map((car, i) => (
                  <div
                    key={car.id}
                    className="flex gap-3 rounded-xl border border-border/70 p-3"
                    style={{
                      animation: "adminRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
                      animationDelay: `${Math.min(i, 12) * 0.03 + 0.25}s`,
                    }}
                  >
                    <img
                      src={car.image}
                      alt={car.name}
                      className="h-16 w-20 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="font-medium leading-tight">{car.name}</div>
                      <div className="text-xs text-muted-foreground">{car.code}</div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold">${car.price.toLocaleString()}</span>
                        <span className="text-muted-foreground">{car.year}</span>
                        {getStatusBadge(car.status)}
                        <Badge variant={car.isActive ? "default" : "secondary"}>
                          {car.isActive ? t("admin.cars.visible") : t("admin.cars.hidden")}
                        </Badge>
                      </div>
                      <div className="pt-1">{carActions(car)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.cars.col.image")}</TableHead>
                      <TableHead>{t("admin.cars.col.name")}</TableHead>
                      <TableHead>{t("admin.cars.col.code")}</TableHead>
                      <TableHead>{t("admin.cars.col.year")}</TableHead>
                      <TableHead>{t("admin.cars.col.price")}</TableHead>
                      <TableHead>{t("admin.cars.col.status")}</TableHead>
                      <TableHead>{t("admin.cars.col.visible")}</TableHead>
                      <TableHead className="text-right">{t("admin.cars.col.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCars.map((car, i) => (
                      <TableRow
                        key={car.id}
                        className="transition-colors hover:bg-muted/50"
                        style={{
                          animation: "adminRise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
                          animationDelay: `${Math.min(i, 12) * 0.03 + 0.25}s`,
                        }}
                      >
                        <TableCell>
                          <img
                            src={car.image}
                            alt={car.name}
                            className="h-12 w-16 rounded object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{car.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{car.code}</TableCell>
                        <TableCell>{car.year}</TableCell>
                        <TableCell>${car.price.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(car.status)}</TableCell>
                        <TableCell>
                          <Badge variant={car.isActive ? "default" : "secondary"}>
                            {car.isActive ? t("admin.cars.visible") : t("admin.cars.hidden")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{carActions(car)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CarFormDialog open={formOpen} onOpenChange={handleFormClose} car={editingCar} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.cars.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.cars.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auth.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("admin.cars.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
