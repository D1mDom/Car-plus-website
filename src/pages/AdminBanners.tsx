import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Trash2, ArrowUp, ArrowDown, Image } from "lucide-react";
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

const AdminBanners = () => {
  const { t } = useLanguage();
  const { data: banners = [] } = useBanners();
  const createBanner = useCreateBanner();
  const deleteBanner = useDeleteBanner();
  const reorder = useUpdateBannerOrder();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { promotionText, setPromotionText } = usePromotion();
  const [promoDraft, setPromoDraft] = useState(promotionText);

  useEffect(() => {
    setPromoDraft(promotionText);
  }, [promotionText]);

  const nextSortOrder = banners.reduce((max, b) => Math.max(max, b.sort_order), 0) + 1;

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("admin.banners.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.banners.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.banners.promoTitle")}</CardTitle>
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
          <Button onClick={savePromo}>{t("admin.banners.promoSave")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            {t("admin.banners.heroTitle")}
          </CardTitle>
          <CardDescription>{t("admin.banners.heroDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 py-10 transition-colors hover:border-primary/50 hover:bg-muted/70"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-primary" />
                <p className="text-sm text-foreground/80">{t("admin.banners.upload")}</p>
              </>
            )}
          </div>

          {banners.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("admin.banners.empty")}</p>
          ) : (
            <div className="space-y-3">
              {banners.map((banner: Banner, i) => (
                <div
                  key={banner.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-2"
                >
                  <img src={banner.image} alt="" className="h-14 w-24 shrink-0 rounded object-cover" />
                  <span className="text-sm text-muted-foreground">#{i + 1}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      aria-label={t("admin.banners.moveUp")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={i === banners.length - 1}
                      onClick={() => move(i, 1)}
                      aria-label={t("admin.banners.moveDown")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteBanner.mutate(banner.id)}
                      aria-label={t("admin.banners.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBanners;
