import { useEffect, useState, useRef } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateBrand,
  useUpdateBrand,
  type Brand,
} from "@/hooks/useBrands";
import { uploadBrandLogo, MAX_UPLOAD_BYTES } from "@/lib/imageUpload";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: z
    .string()
    .min(1, "Logo is required")
    .refine(
      (val) => val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/"),
      "Enter a valid image URL"
    ),
  sort_order: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface BrandFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: Brand | null;
  nextSortOrder: number;
}

const BrandFormDialog = ({ open, onOpenChange, brand, nextSortOrder }: BrandFormDialogProps) => {
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const [isUploading, setIsUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", logo: "", sort_order: nextSortOrder, is_active: true },
  });

  const logo = form.watch("logo");

  useEffect(() => {
    if (brand) {
      form.reset({
        name: brand.name,
        logo: brand.logo,
        sort_order: brand.sort_order,
        is_active: brand.is_active,
      });
    } else {
      form.reset({ name: "", logo: "", sort_order: nextSortOrder, is_active: true });
    }
  }, [brand, nextSortOrder, form]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("admin.brands.badFile"));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(t("admin.brands.tooLarge"));
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadBrandLogo(file);
      form.setValue("logo", url, { shouldValidate: true });
      toast.success(t("admin.brands.uploadOk"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.brands.uploadFail"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = (values: FormValues) => {
    if (brand) {
      updateBrand.mutate(
        { id: brand.id, ...values },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createBrand.mutate(values, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isLoading = createBrand.isPending || updateBrand.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brand ? t("brands.form.edit") : t("brands.form.add")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brands.form.logo")}</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFile(e.target.files[0]);
                        }}
                      />

                      {logo ? (
                        <div className="relative flex items-center gap-4 rounded-2xl border border-border bg-white p-4">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-white p-2">
                            <img
                              src={logo}
                              alt={t("brands.form.logo")}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="truncate text-sm text-muted-foreground">{t("brands.form.logoReady")}</p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                              >
                                {t("brands.form.changeLogo")}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => field.onChange("")}
                              >
                                <X className="mr-1 h-3.5 w-3.5" />
                                {t("brands.form.removeLogo")}
                              </Button>
                            </div>
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
                            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                            dragging
                              ? "border-primary bg-primary/5"
                              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40",
                            isUploading && "pointer-events-none opacity-70"
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
                            {isUploading ? t("brands.form.uploading") : t("brands.form.dropFile")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("brands.form.dropHint")}
                          </span>
                          <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
                            <Upload className="h-3.5 w-3.5" />
                            {t("brands.form.addLogo")}
                          </span>
                        </button>
                      )}

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">{t("brands.form.orUrl")}</span>
                        </div>
                      </div>

                      <Input
                        {...field}
                        type="url"
                        placeholder={t("brands.form.logoUrlPlaceholder")}
                        onChange={(e) => field.onChange(e.target.value.trim())}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>{t("brands.form.logoUrlHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brands.form.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("brands.form.namePlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription>{t("brands.form.nameHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brands.form.order")}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t("brands.form.active")}</FormLabel>
                    <FormDescription>{t("brands.form.activeHint")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? t("form.saving") : brand ? t("form.save") : t("brands.form.addBtn")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BrandFormDialog;
