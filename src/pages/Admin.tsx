import { useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCars, useDeleteCar, getStatusLabel } from "@/hooks/useCars";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Car, Loader2, Phone, Download, Upload } from "lucide-react";
import { Link } from "react-router-dom";
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

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { data: cars, isLoading: carsLoading } = useCars();
  const deleteCar = useDeleteCar();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // team_members/banners/contact_info aren't in the generated Supabase types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Export all editable data as a JSON backup file. It can be restored from the
  // website via the Import button below (or into any Car Plus database).
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

  // Restore data from a JSON backup file. Uses upsert, so it merges by id
  // without creating duplicates, and updates rows that already exist.
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
        // contact_info only allows UPDATE (single seeded row id=1), not insert.
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

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-destructive mb-4">គ្មានសិទ្ធិចូល</h1>
            <p className="text-muted-foreground mb-6">អ្នកគ្មានសិទ្ធិចូលទំព័រនេះទេ។</p>
            <Button asChild>
              <Link to="/">ត្រឡប់ទៅទំព័រដើម</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
    return <Badge variant={variants[status] || "default"}>{getStatusLabel(status as CarStatus)}</Badge>;
  };

  // Only real (database) cars belong in the admin. The demo fallback cars
  // (id "mock-...") aren't real rows, so they can't be edited or deleted.
  const realCars = (cars ?? []).filter((c) => !String(c.id).startsWith("mock-"));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">ផ្ទាំងគ្រប់គ្រង</h1>
              <p className="text-muted-foreground">គ្រប់គ្រងស្តុកឡានរបស់អ្នក</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button variant="outline" onClick={handleBackup}>
                <Download className="h-4 w-4 mr-2" />
                Backup
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleImport(e.target.files[0]); }}
              />
              <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Import
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/contact">
                  <Phone className="h-4 w-4 mr-2" />
                  ទំនាក់ទំនង
                </Link>
              </Button>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                បន្ថែមឡាន
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ឡានសរុប</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realCars.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ឡានរួចរាល់</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {realCars.filter(c => c.status === "ready").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ឡានប្រណីត</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {realCars.filter(c => c.status === "luxury").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">តម្លៃសរុប</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${realCars.reduce((sum, c) => sum + c.price, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cars Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                ស្តុកឡាន
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
                        <TableHead>រូបភាព</TableHead>
                        <TableHead>ឈ្មោះ</TableHead>
                        <TableHead>លេខកូដ</TableHead>
                        <TableHead>ឆ្នាំ</TableHead>
                        <TableHead>តម្លៃ</TableHead>
                        <TableHead>ស្ថានភាព</TableHead>
                        <TableHead>បង្ហាញ</TableHead>
                        <TableHead className="text-right">សកម្មភាព</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {realCars.map((car) => (
                        <TableRow key={car.id}>
                          <TableCell>
                            <img
                              src={car.image}
                              alt={car.name}
                              className="w-16 h-12 object-cover rounded"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{car.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{car.code}</TableCell>
                          <TableCell>{car.year}</TableCell>
                          <TableCell>${car.price.toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(car.status)}</TableCell>
                          <TableCell>
                            <Badge variant={car.isActive ? "default" : "secondary"}>
                              {car.isActive ? "បង្ហាញ" : "លាក់"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(car)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(car.id)}
                              >
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
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>គ្មានឡានក្នុងស្តុកទេ</p>
                  <Button className="mt-4" onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    បន្ថែមឡានដំបូង
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      <CarFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        car={editingCar}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>លុបឡាន</AlertDialogTitle>
            <AlertDialogDescription>
              តើអ្នកប្រាកដទេថាចង់លុបឡាននេះ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>បោះបង់</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>លុប</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
