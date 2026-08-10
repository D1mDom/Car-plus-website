import { useState, useRef } from "react";
import { useCars, useDeleteCar } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Car, Loader2, Download, Upload, Sparkles, CircleDollarSign, BadgeCheck } from "lucide-react";
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
import type { Car as CarType, CarStatus } from "@/hooks/useCars";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const Admin = () => {
  const { t } = useLanguage();
  const { data: cars, isLoading: carsLoading } = useCars();
  const deleteCar = useDeleteCar();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
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
      const fail = (e: unknown) => { if (e) throw e; };

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
        err instanceof Error ? err.message
          : err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message)
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

  const realCars = (cars ?? []).filter((c) => !String(c.id).startsWith("mock-"));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin.cars.title")}</h1>
          <p className="text-muted-foreground">{t("admin.cars.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleBackup}>
            <Download className="mr-2 h-4 w-4" />
            {t("admin.cars.backup")}
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleImport(e.target.files[0]); }}
          />
          <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {t("admin.cars.import")}
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.cars.add")}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("admin.cars.total"), value: realCars.length, icon: Car, tone: "text-[hsl(350_70%_48%)] bg-[hsl(350_70%_52%/0.12)]" },
          { label: t("admin.cars.ready"), value: realCars.filter((c) => c.status === "ready").length, icon: BadgeCheck, tone: "text-emerald-600 bg-emerald-500/10" },
          { label: t("admin.cars.luxury"), value: realCars.filter((c) => c.status === "luxury").length, icon: Sparkles, tone: "text-amber-600 bg-amber-500/10" },
          { label: t("admin.cars.value"), value: `$${realCars.reduce((sum, c) => sum + c.price, 0).toLocaleString()}`, icon: CircleDollarSign, tone: "text-sky-600 bg-sky-500/10" },
        ].map((s) => (
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

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-[hsl(350_70%_48%)]" />
            {t("admin.cars.list")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : realCars.length > 0 ? (
            <div className="overflow-x-auto">
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
                  {realCars.map((car) => (
                    <TableRow key={car.id}>
                      <TableCell>
                        <img src={car.image} alt={car.name} className="h-12 w-16 rounded object-cover" />
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(car)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(car.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Car className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>{t("admin.cars.empty")}</p>
              <Button className="mt-4" onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.cars.addFirst")}
              </Button>
            </div>
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
