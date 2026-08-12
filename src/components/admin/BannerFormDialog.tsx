import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateBanner,
  useUpdateBanner,
  type Banner,
} from "@/hooks/useBanners";
import { uploadImage, MAX_UPLOAD_BYTES } from "@/lib/imageUpload";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { onImgError } from "@/lib/imageFallback";

const formSchema = z.object({
  image: z
    .string()
    .min(1, "Image is required")
    .refine(
      (val) => val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/"),
      "Enter a valid image URL",
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
  nextSortOrder: number;
}

const BannerFormDialog = ({ open, onOpenChange, banner, nextSortOrder }: BannerFormDialogProps) => {
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const [isUploading, setIsUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { image: "" },
  });

  const image = form.watch("image");

  useEffect(() => {
    if (banner) {
      form.reset({ image: banner.image });
    } else {
      form.reset({ image: "" });
    }
  }, [banner, form]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("admin.banners.badFile"));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(t("admin.banners.tooLarge"));
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      form.setValue("image", url, { shouldValidate: true });
      toast.success(t("admin.banners.form.uploadOk"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.banners.uploadFail"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = (values: FormValues) => {
    if (banner) {
      updateBanner.mutate(
        { id: banner.id, image: values.image },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createBanner.mutate(
        { image: values.image, sort_order: nextSortOrder },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  const isLoading = createBanner.isPending || updateBanner.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {banner ? t("admin.banners.form.editTitle") : t("admin.banners.form.addTitle")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.banners.form.image")}</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFile(e.target.files[0]);
                        }}
                      />

                      {image ? (
                        <div className="space-y-3">
                          <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                            <img
                              src={image}
                              alt=""
                              onError={onImgError}
                              className="aspect-[21/9] w-full object-cover"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                            >
                              {t("admin.banners.form.changeImage")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => field.onChange("")}
                            >
                              <X className="mr-1 h-3.5 w-3.5" />
                              {t("admin.banners.form.removeImage")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            setDragging(true);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setDragging(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragging(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleFile(file);
                          }}
                          className={cn(
                            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
                            dragging
                              ? "border-primary bg-primary/5"
                              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40",
                            isUploading && "pointer-events-none opacity-70",
                          )}
                        >
                          {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          ) : (
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <ImagePlus className="h-6 w-6" />
                            </span>
                          )}
                          <span className="text-sm font-semibold text-foreground">
                            {isUploading ? t("admin.banners.form.uploading") : t("admin.banners.form.dropFile")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("admin.banners.form.dropHint")}
                          </span>
                          <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
                            <Upload className="h-3.5 w-3.5" />
                            {t("admin.banners.upload")}
                          </span>
                        </button>
                      )}

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            {t("admin.banners.form.orUrl")}
                          </span>
                        </div>
                      </div>

                      <Input
                        {...field}
                        type="url"
                        placeholder={t("admin.banners.form.urlPlaceholder")}
                        onChange={(e) => field.onChange(e.target.value.trim())}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>{t("admin.banners.form.urlHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? t("form.saving") : t("form.save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BannerFormDialog;
