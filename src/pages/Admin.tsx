import { useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCars, useDeleteCar, getStatusLabel } from "@/hooks/useCars";
import { useTeam, isRealTeamMember } from "@/hooks/useTeam";
import { useBanners } from "@/hooks/useBanners";
import { useContact } from "@/hooks/useContact";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Car, Loader2, Phone, Download } from "lucide-react";
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
  const { data: teamData = [] } = useTeam();
  const { data: bannersData = [] } = useBanners();
  const { data: contactData } = useContact();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<string | null>(null);

  // One-click backup: download all editable content as a restorable .sql file.
  // Paste it into the Supabase SQL Editor (on a database that already has the
  // schema from supabase_setup.sql) to restore the data.
  const handleBackup = () => {
    // Format any value as a SQL literal, escaping quotes and building text[] arrays.
    const sql = (v: unknown): string => {
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "number") return String(v);
      if (typeof v === "boolean") return v ? "true" : "false";
      if (Array.isArray(v)) {
        return `ARRAY[${v.map((x) => `'${String(x).replace(/'/g, "''")}'`).join(", ")}]::text[]`;
      }
      return `'${String(v).replace(/'/g, "''")}'`;
    };

    const realCarsData = (cars ?? []).filter((c) => !String(c.id).startsWith("mock-"));
    const lines: string[] = [
      `-- Car Plus data backup — ${new Date().toISOString()}`,
      `-- Restore: run supabase_setup.sql first (schema), then paste this in the SQL Editor.`,
      "",
    ];

    for (const c of realCarsData) {
      lines.push(
        `INSERT INTO public.cars (id, code, name, model, year, price, status, viewers, image, images, body_type, tax_status, condition, fuel_type, color, description, is_active) VALUES (` +
        [c.id, c.code, c.name, c.model, c.year, c.price, c.status, c.viewers, c.image, c.images, c.bodyType, c.taxStatus, c.condition, c.fuelType, c.color, c.description, c.isActive ?? true].map(sql).join(", ") +
        `) ON CONFLICT (id) DO NOTHING;`
      );
    }
    for (const m of teamData.filter((t) => isRealTeamMember(t.id))) {
      lines.push(
        `INSERT INTO public.team_members (id, name, role, image, sort_order) VALUES (` +
        [m.id, m.name, m.role, m.image, m.sort_order].map(sql).join(", ") +
        `) ON CONFLICT (id) DO NOTHING;`
      );
    }
    for (const b of bannersData) {
      lines.push(
        `INSERT INTO public.banners (id, image, sort_order) VALUES (` +
        [b.id, b.image, b.sort_order].map(sql).join(", ") +
        `) ON CONFLICT (id) DO NOTHING;`
      );
    }
    if (contactData) {
      lines.push(
        `INSERT INTO public.contact_info (id, phone, telegram, facebook, address, email, map_link) VALUES (1, ` +
        [contactData.phone, contactData.telegram, contactData.facebook, contactData.address, contactData.email, contactData.map_link].map(sql).join(", ") +
        `) ON CONFLICT (id) DO UPDATE SET phone=EXCLUDED.phone, telegram=EXCLUDED.telegram, facebook=EXCLUDED.facebook, address=EXCLUDED.address, email=EXCLUDED.email, map_link=EXCLUDED.map_link;`
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carplus-backup-${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded (SQL)");
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
