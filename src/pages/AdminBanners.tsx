import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Loader2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image,
  Pencil,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useBanners,
  useCreateBanner,
  useDeleteBanner,
  useUpdateBannerOrder,
  type Banner,
} from "@/hooks/useBanners";
import { uploadImage, MAX_UPLOAD_BYTES } from "@/lib/imageUpload";
import { usePromotion } from "@/hooks/usePromotion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BannerFormDialog from "@/components/admin/BannerFormDialog";
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

const AdminBanners = () => {
  const { t } = useLanguage();
  const { data: banners = [], isLoading } = useBanners();
  const createBanner = useCreateBanner();
  const deleteBanner = useDeleteBanner();
  const reorder = useUpdateBannerOrder();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { promotionText, setPromotionText } = usePromotion();
  const [promoDraft, setPromoDraft] = useState(promotionText);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    setPromoDraft(promotionText);
  }, [promotionText]);

  useEffect(() => {
    if (previewIndex > banners.length - 1) setPreviewIndex(0);
  }, [banners.length, previewIndex]);

  const nextSortOrder = banners.reduce((max, b) => Math.max(max, b.sort_order), 0) + 1;

  const handleAdd = () => {
    setEditingBanner(null);
    setFormOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteBanner.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    setIsUploading(true);
    try {
      let order = nextSortOrder;
      for (const file of arr) {
        if (!file.type.startsWith("image/")) {
          toast.error(t("admin.banners.badFile"));
          continue;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          toast.error(t("admin.banners.tooLarge"));
          continue;
        }
        const url = await uploadImage(file);
        await createBanner.mutateAsync({ image: url, sort_order: order++ });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.banners.uploadFail"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= banners.length) return;
    const a = banners[index];
    const b = banners[target];
    reorder.mutate([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
  };

  const savePromo = () => {
    setPromotionText(promoDraft.trim());
    toast.success(t("admin.banners.promoSaved"));
  };

  const scrollPrev = useCallback(() => {
    if (banners.length === 0) return;
    setPreviewIndex((i) => (i - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const scrollNext = useCallback(() => {
    if (banners.length === 0) return;
    setPreviewIndex((i) => (i + 1) % banners.length);
  }, [banners.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("admin.banners.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("admin.banners.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="gap-1.5">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t("admin.banners.viewSite")}
            </a>
          </Button>
          <Button onClick={handleAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("admin.banners.add")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-5 w-5 text-primary" />
              {t("admin.banners.promoTitle")}
            </CardTitle>
            <CardDescription>{t("admin.banners.promoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="promo">{t("admin.banners.promoLabel")}</Label>
              <Input
                id="promo"
                value={promoDraft}
                onChange={(e) => setPromoDraft(e.target.value)}
                placeholder={t("admin.banners.promoPlaceholder")}
              />
            </div>
            {promoDraft.trim() && (
              <div className="rounded-lg border border-border bg-[#174080] px-4 py-2 text-center text-sm font-medium text-white">
                {promoDraft.trim()}
              </div>
            )}
            <Button onClick={savePromo}>{t("admin.banners.promoSave")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("admin.banners.previewTitle")}</CardTitle>
            <CardDescription>{t("admin.banners.previewDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {banners.length === 0 ? (
              <div className="flex aspect-[21/9] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                {t("admin.banners.empty")}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                <div className="relative aspect-[21/9] w-full">
                  {banners.map((banner, index) => (
                    <img
                      key={banner.id}
                      src={banner.image}
                      alt=""
                      onError={onImgError}
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                        previewIndex === index ? "opacity-100" : "opacity-0",
                      )}
                    />
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                {banners.length > 1 && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                      onClick={scrollPrev}
                      aria-label={t("admin.banners.moveUp")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
                      {previewIndex + 1} / {banners.length}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                      onClick={scrollNext}
                      aria-label={t("admin.banners.moveDown")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Image className="h-5 w-5 text-primary" />
            {t("admin.banners.heroTitle")}
          </CardTitle>
          <CardDescription>{t("admin.banners.heroDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-10 transition-colors hover:border-primary/50 hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-60"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-primary" />
                <p className="text-sm font-medium text-foreground">{t("admin.banners.upload")}</p>
                <p className="text-xs text-muted-foreground">{t("admin.banners.form.dropHint")}</p>
              </>
            )}
          </button>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : banners.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Image className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p>{t("admin.banners.empty")}</p>
              <p className="mt-1 text-sm">{t("admin.banners.emptyHint")}</p>
              <Button className="mt-4 gap-1.5" onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                {t("admin.banners.addFirst")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {banners.map((banner: Banner, i) => (
                <div
                  key={banner.id}
                  className="overflow-hidden rounded-xl border border-border bg-background"
                >
                  <div className="relative aspect-[21/9] bg-black">
                    <img
                      src={banner.image}
                      alt=""
                      onError={onImgError}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                      #{i + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border/60 p-3">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={i === 0 || reorder.isPending}
                        onClick={() => move(i, -1)}
                        aria-label={t("admin.banners.moveUp")}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={i === banners.length - 1 || reorder.isPending}
                        onClick={() => move(i, 1)}
                        aria-label={t("admin.banners.moveDown")}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => handleEdit(banner)}
                        aria-label={t("admin.banners.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => setDeleteId(banner.id)}
                        aria-label={t("admin.banners.delete")}
                      >
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

      <BannerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        banner={editingBanner}
        nextSortOrder={nextSortOrder}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.banners.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.banners.deleteBody")}</AlertDialogDescription>
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

export default AdminBanners;
