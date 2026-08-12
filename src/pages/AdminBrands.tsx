import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  Plus,
  Tag,
  Loader2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Eye,
  EyeOff,
  LayoutGrid,
} from "lucide-react";
import {
  useBrands,
  useDeleteBrand,
  useUpdateBrandOrder,
  type Brand,
} from "@/hooks/useBrands";
import { useLanguage } from "@/hooks/useLanguage";
import BrandFormDialog from "@/components/admin/BrandFormDialog";
import BrandLogo from "@/components/BrandLogo";
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

const CARD_GRADIENTS = [
  "from-[#7B6CF6] to-[#5B8DEF]",
  "from-[#4BA3E8] to-[#2E7BC4]",
  "from-[#F0786A] to-[#E85A8C]",
  "from-[#5EC97A] to-[#3AA55C]",
  "from-[#F0A04B] to-[#E07A3A]",
  "from-[#5B9BD5] to-[#3D6FA8]",
  "from-[#C45C8A] to-[#8E4A9E]",
  "from-[#2DB5A0] to-[#1A8F7A]",
];

type VisibilityFilter = "all" | "active" | "hidden";

function BrandCardFace({
  brand,
  gradient,
  orderLabel,
  showHiddenBadge = false,
  hiddenLabel,
  compact = false,
}: {
  brand: Brand;
  gradient: string;
  orderLabel?: string;
  showHiddenBadge?: boolean;
  hiddenLabel?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br shadow-md",
        compact ? "min-h-[132px] p-4" : "min-h-[148px] p-5 sm:min-h-[160px] sm:p-6",
        gradient,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full border-[28px] border-white/10 sm:h-48 sm:w-48 sm:border-[32px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-2 -right-2 h-24 w-24 rounded-full border-[18px] border-white/10 sm:h-28 sm:w-28 sm:border-[20px]"
      />

      <div
        className={cn(
          "relative z-10 flex flex-col justify-between",
          compact ? "min-h-[100px]" : "min-h-[108px] sm:min-h-[120px]",
        )}
      >
        <div className="pr-[4.5rem] sm:pr-20">
          {orderLabel ? (
            <span className="mb-1.5 inline-flex rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">
              {orderLabel}
            </span>
          ) : null}
          <h4
            className={cn(
              "font-heading font-bold leading-tight text-white drop-shadow-sm",
              compact ? "text-base" : "text-lg sm:text-xl",
            )}
          >
            {brand.name}
          </h4>
        </div>

        <div className="absolute bottom-0 right-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg sm:h-16 sm:w-16 sm:p-2.5">
          <BrandLogo
            brand={brand.name}
            logoUrl={brand.logo}
            iconClassName="h-full w-full max-h-10 max-w-10 object-contain sm:max-h-12 sm:max-w-12"
          />
        </div>
      </div>

      {showHiddenBadge ? (
        <Badge className="absolute bottom-3 left-4 z-10 bg-black/50 text-white hover:bg-black/50">
          {hiddenLabel}
        </Badge>
      ) : null}
    </div>
  );
}

const AdminBrands = () => {
  const { t } = useLanguage();
  const { data: brands = [], isLoading } = useBrands({ activeOnly: false });
  const deleteBrand = useDeleteBrand();
  const reorder = useUpdateBrandOrder();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");

  const nextSortOrder = brands.reduce((max, b) => Math.max(max, b.sort_order), 0) + 1;

  const activeBrands = useMemo(() => brands.filter((b) => b.is_active), [brands]);
  const hiddenCount = brands.length - activeBrands.length;

  const filteredBrands = useMemo(() => {
    if (visibilityFilter === "active") return brands.filter((b) => b.is_active);
    if (visibilityFilter === "hidden") return brands.filter((b) => !b.is_active);
    return brands;
  }, [brands, visibilityFilter]);

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

  const move = (brandId: string, dir: -1 | 1) => {
    const index = brands.findIndex((b) => b.id === brandId);
    const target = index + dir;
    if (index < 0 || target < 0 || target >= brands.length) return;
    const a = brands[index];
    const b = brands[target];
    reorder.mutate([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#174080]/10 text-[#174080]">
            <LayoutGrid className="h-5 w-5" />
          </span>
          <p className="max-w-xl text-sm text-muted-foreground">{t("admin.brands.pageHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="gap-1.5">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t("admin.brands.viewSite")}
            </a>
          </Button>
          <Button onClick={handleAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("brands.add")}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: t("admin.brands.total"),
            value: brands.length,
            icon: Tag,
            tone: "bg-[#174080]/10 text-[#174080]",
          },
          {
            label: t("admin.brands.activeCount"),
            value: activeBrands.length,
            icon: Eye,
            tone: "bg-emerald-500/10 text-emerald-600",
          },
          {
            label: t("admin.brands.hiddenCount"),
            value: hiddenCount,
            icon: EyeOff,
            tone: "bg-muted text-muted-foreground",
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                {label}
                <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", tone)}>
                  <Icon className="h-5 w-5" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.brands.previewTitle")}</CardTitle>
          <CardDescription>{t("admin.brands.previewDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {activeBrands.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              {t("admin.brands.previewEmpty")}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {activeBrands.map((brand, index) => (
                <div key={brand.id} className="w-[180px] shrink-0 sm:w-[200px]">
                  <BrandCardFace
                    brand={brand}
                    gradient={CARD_GRADIENTS[index % CARD_GRADIENTS.length]}
                    compact
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(["all", "active", "hidden"] as const).map((key) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={visibilityFilter === key ? "default" : "outline"}
            onClick={() => setVisibilityFilter(key)}
            className="gap-1.5 rounded-full"
          >
            {key === "all"
              ? t("admin.cars.filterAll")
              : key === "active"
                ? t("brands.statusActive")
                : t("brands.statusHidden")}
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 justify-center px-1.5 text-[10px]">
              {key === "all" ? brands.length : key === "active" ? activeBrands.length : hiddenCount}
            </Badge>
          </Button>
        ))}
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-5 w-5 text-[#174080]" />
            {t("brands.all")}
          </CardTitle>
          <CardDescription>{t("admin.brands.hint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : brands.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
              <Tag className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p>{t("brands.none")}</p>
              <p className="mt-1 text-sm">{t("admin.brands.emptyHint")}</p>
              <Button className="mt-4 gap-1.5" onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                {t("brands.addFirst")}
              </Button>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>{t("admin.brands.noFilterResults")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBrands.map((brand) => {
                const globalIndex = brands.findIndex((b) => b.id === brand.id);
                return (
                <div
                  key={brand.id}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-sm transition-shadow hover:shadow-md",
                    !brand.is_active && "opacity-75",
                  )}
                >
                  <BrandCardFace
                    brand={brand}
                    gradient={CARD_GRADIENTS[globalIndex % CARD_GRADIENTS.length]}
                    orderLabel={`#${globalIndex + 1}`}
                    showHiddenBadge={!brand.is_active}
                    hiddenLabel={t("brands.statusHidden")}
                  />

                  <div className="mt-auto space-y-2 border-t border-border/60 bg-muted/20 p-3">
                    <p className="text-center text-xs text-muted-foreground">
                      {t("brands.form.order")}: {brand.sort_order}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={globalIndex === 0 || reorder.isPending}
                        onClick={() => move(brand.id, -1)}
                        aria-label={t("admin.banners.moveUp")}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={globalIndex === brands.length - 1 || reorder.isPending}
                        onClick={() => move(brand.id, 1)}
                        aria-label={t("admin.banners.moveDown")}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => handleEdit(brand)}
                        aria-label={t("brands.form.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => setDeleteId(brand.id)}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
              })}
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
