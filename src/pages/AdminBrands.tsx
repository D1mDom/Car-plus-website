import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Tag, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import {
  useBrands,
  useDeleteBrand,
  useUpdateBrandOrder,
  type Brand,
} from "@/hooks/useBrands";
import { useLanguage } from "@/hooks/useLanguage";
import BrandFormDialog from "@/components/admin/BrandFormDialog";
import { onImgError } from "@/lib/imageFallback";
import { cn } from "@/lib/utils";
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

const AdminBrands = () => {
  const { t } = useLanguage();
  const { data: brands = [], isLoading } = useBrands({ activeOnly: false });
  const deleteBrand = useDeleteBrand();
  const reorder = useUpdateBrandOrder();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const nextSortOrder = brands.reduce((max, b) => Math.max(max, b.sort_order), 0) + 1;

  const handleAdd = () => {
    setEditingBrand(null);
    setFormOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteBrand.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= brands.length) return;
    const a = brands[index];
    const b = brands[target];
    reorder.mutate([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin.brands.title")}</h1>
          <p className="text-muted-foreground">{t("admin.brands.subtitle")}</p>
        </div>
        <Button onClick={handleAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t("brands.add")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-5 w-5" />
            {t("brands.all")}
          </CardTitle>
          <CardDescription>{t("admin.brands.hint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : brands.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Tag className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p>{t("brands.none")}</p>
              <p className="mt-1 text-sm">{t("admin.brands.emptyHint")}</p>
              <Button className="mt-4" onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                {t("brands.addFirst")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand, index) => (
                <div
                  key={brand.id}
                  className={cn(
                    "rounded-xl border border-border bg-background p-4",
                    !brand.is_active && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-white p-2">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          onError={onImgError}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">{brand.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h4 className="truncate font-semibold text-foreground">{brand.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {brand.is_active ? t("brands.statusActive") : t("brands.statusHidden")}
                        {" · "}
                        {t("brands.form.order")}: {brand.sort_order}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={index === 0 || reorder.isPending}
                        onClick={() => move(index, -1)}
                        aria-label={t("admin.banners.moveUp")}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={index === brands.length - 1 || reorder.isPending}
                        onClick={() => move(index, 1)}
                        aria-label={t("admin.banners.moveDown")}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(brand)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteId(brand.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BrandFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        brand={editingBrand}
        nextSortOrder={nextSortOrder}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("brands.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("brands.deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("form.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBrands;
