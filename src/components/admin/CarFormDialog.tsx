import { useEffect, useState, useRef, type ReactNode } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCar, useUpdateCar, type Car, type CarStatus } from "@/hooks/useCars";
import { Upload, X, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { safeUUID } from "@/lib/utils";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const CAR_IMAGES_BUCKET = "car-images";

// Accept photos straight off a phone or DSLR, but never store them at that
// size. Anything larger than MAX_IMAGE_DIMENSION is scaled down and re-encoded
// to WebP, which typically turns a 50MB original into a few hundred KB with no
// visible loss at the sizes this site displays.
const MAX_IMAGE_DIMENSION = 1920;
const WEBP_QUALITY = 0.85;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file"));
    };
    img.src = url;
  });

const compressImage = async (
  file: File,
): Promise<{ blob: Blob; extension: string }> => {
  // GIFs would lose their animation on a canvas round-trip, so pass them through.
  if (file.type === "image/gif") {
    return { blob: file, extension: "gif" };
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: file, extension: file.name.split(".").pop() || "jpg" };

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
  );

  // If WebP encoding isn't available, fall back to the original file rather
  // than failing the upload.
  if (!blob) return { blob: file, extension: file.name.split(".").pop() || "jpg" };

  return { blob, extension: "webp" };
};

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive("Price must be greater than 0"),
  status: z.enum(["ready", "onroad", "luxury", "plate"]),
  viewers: z.coerce.number().min(0).default(0),
  images: z.array(z.string()).min(1, "At least one photo is required"),
  bodyType: z.string().min(1, "Body type is required"),
  taxStatus: z.string().min(1, "Tax status is required"),
  condition: z.string().min(1, "Condition is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  color: z.string().min(1, "Color is required"),
  description: z.string(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: Car | null;
  /** Render as a full page form instead of a modal dialog. */
  variant?: "dialog" | "page";
}

const CarFormDialog = ({ open, onOpenChange, car, variant = "dialog" }: CarFormDialogProps) => {
  const createCar = useCreateCar();
  const updateCar = useUpdateCar();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [failedDraftUrls, setFailedDraftUrls] = useState<Set<string>>(new Set());
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      model: "",
      year: new Date().getFullYear(),
      price: 0,
      status: "ready",
      viewers: 0,
      images: [],
      bodyType: "Sedan",
      taxStatus: "ក្រដាសពន្ធ",
      condition: "Excellent",
      fuelType: "Petrol",
      color: "White",
      description: "",
      isActive: true,
    },
  });

  const images = form.watch("images") || [];

  useEffect(() => {
    if (car) {
      form.reset({
        code: car.code,
        name: car.name,
        model: car.model,
        year: car.year,
        price: car.price,
        status: car.status,
        viewers: car.viewers,
        images: car.images && car.images.length > 0 ? car.images : (car.image ? [car.image] : []),
        bodyType: car.bodyType,
        taxStatus: car.taxStatus,
        condition: car.condition,
        fuelType: car.fuelType,
        color: car.color,
        description: car.description.join("\n"),
        isActive: car.isActive ?? true,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        model: "",
        year: new Date().getFullYear(),
        price: 0,
        status: "ready",
        viewers: 0,
        images: [],
        bodyType: "Sedan",
        taxStatus: "ក្រដាសពន្ធ",
        condition: "Excellent",
        fuelType: "Petrol",
        color: "White",
        description: "",
        isActive: true,
      });
    }
    setImageUrl("");
    setFailedDraftUrls(new Set());
  }, [car, form, open]);

  const parseImageUrls = (raw: string): string[] => {
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const part of raw.split(/[\n,]+/)) {
      const url = part.trim();
      if (!url || seen.has(url)) continue;
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
        seen.add(url);
        urls.push(url);
      } catch {
        // skip invalid
      }
    }
    return urls;
  };

  const draftUrls = parseImageUrls(imageUrl);

  const mergePendingUrls = (): string[] => {
    const pending = parseImageUrls(imageUrl);
    const current = form.getValues("images") || [];
    if (pending.length === 0) return current;
    const currentSet = new Set(current);
    const merged = [...current, ...pending.filter((url) => !currentSet.has(url))];
    form.setValue("images", merged, { shouldValidate: true });
    setImageUrl("");
    setFailedDraftUrls(new Set());
    return merged;
  };

  // Uploads to the car-images bucket and returns its public URL. The image
  // column stores that URL, not the file itself — embedding base64 here would
  // put megabytes into every car row and re-download them on each page load.
  const uploadImage = async (file: File): Promise<string> => {
    const { blob, extension } = await compressImage(file);
    const path = `${safeUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(CAR_IMAGES_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(CAR_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  // Upload one or more files, appending each resulting URL to the images array.
  // Each file is handled independently so one failure doesn't abandon the rest,
  // and the real storage error is surfaced instead of a generic message.
  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    setIsUploading(true);
    let uploaded = 0;
    try {
      for (const file of arr) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name}: not an image file`);
          continue;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          toast.error(`${file.name}: must be less than 50MB`);
          continue;
        }
        try {
          const publicUrl = await uploadImage(file);
          const current = form.getValues("images") || [];
          form.setValue("images", [...current, publicUrl], { shouldValidate: true });
          uploaded++;
        } catch (err) {
          // Supabase storage errors are plain objects with a `message`.
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: unknown }).message)
              : "upload failed";
          toast.error(`${file.name}: ${message}`);
        }
      }
      if (uploaded > 0) {
        toast.success(`${uploaded} image${uploaded > 1 ? "s" : ""} uploaded successfully`);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImageAt = (index: number) => {
    const current = form.getValues("images") || [];
    form.setValue(
      "images",
      current.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  const addImageFromUrl = () => {
    const raw = imageUrl.trim();
    if (!raw) {
      toast.error(t("form.imageUrlEmpty"));
      return;
    }

    const parsed = parseImageUrls(raw);
    if (parsed.length === 0) {
      toast.error(t("form.imageUrlInvalid"));
      return;
    }

    const current = form.getValues("images") || [];
    const currentSet = new Set(current);
    const fresh = parsed.filter((url) => !currentSet.has(url));

    if (fresh.length === 0) {
      toast.error(t("form.imageUrlDuplicate"));
      return;
    }

    mergePendingUrls();
    toast.success(
      fresh.length === 1
        ? t("form.imageUrlAdded")
        : t("form.imageUrlAddedMany").replace("{count}", String(fresh.length))
    );
  };

  const onSubmit = (values: FormValues) => {
    const carData = {
      ...values,
      image: values.images[0], // first photo is the cover
      description: values.description.split("\n").filter(Boolean),
    };

    if (car) {
      updateCar.mutate(
        { id: car.id, ...carData },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      createCar.mutate(carData as Parameters<typeof createCar.mutate>[0], {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Commit pasted URLs before zod validation so photos in the box count.
    mergePendingUrls();
    void form.handleSubmit(onSubmit)();
  };

  const isLoading = createCar.isPending || updateCar.isPending;
  const isPage = variant === "page";

  const Section = ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: ReactNode;
  }) =>
    isPage ? (
      <section className="space-y-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="space-y-0.5 border-b border-border/60 pb-3">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </section>
    ) : (
      <div className="space-y-4">{children}</div>
    );

  const formBody = (
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className={isPage ? "space-y-5" : "space-y-4"}>
              <Section title={t("form.section.basic")} description={isPage ? t("form.section.basicHint") : undefined}>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.code")}</FormLabel>
                      <FormControl>
                        <Input placeholder="DCS2024_..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.name")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota Camry SE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.model")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota Camry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.year")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.price")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.status")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ready">{t("status.ready")}</SelectItem>
                          <SelectItem value="onroad">{t("status.onroad")}</SelectItem>
                          <SelectItem value="luxury">{t("status.luxury")}</SelectItem>
                          <SelectItem value="plate">{t("status.plate")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </Section>

              <Section title={t("form.section.photos")} description={isPage ? t("form.section.photosHint") : undefined}>
              <FormField
                control={form.control}
                name="images"
                render={() => (
                  <FormItem>
                    {!isPage ? <FormLabel>{t("form.photos")}</FormLabel> : null}
                    <FormControl>
                      <div className="space-y-3">
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

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {images.map((url, i) => (
                            <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                              <img src={url} alt={`${t("form.photos")} ${i + 1}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              {i === 0 && (
                                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                  {t("form.cover")}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImageAt(i)}
                                aria-label={t("form.removePhoto")}
                                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}

                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                              isDragging
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            {isUploading ? (
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">{t("form.addPhoto")}</p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                          <p className="text-xs font-medium text-foreground">{t("form.orImageUrl")}</p>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                            <Textarea
                              value={imageUrl}
                              onChange={(e) => {
                                setImageUrl(e.target.value);
                                setFailedDraftUrls(new Set());
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                  e.preventDefault();
                                  addImageFromUrl();
                                }
                              }}
                              placeholder={t("form.imageUrlPlaceholder")}
                              className="min-h-[80px] flex-1 resize-y bg-background"
                              rows={3}
                            />
                            <Button type="button" variant="outline" className="gap-1.5 shrink-0" onClick={addImageFromUrl}>
                              <Link2 className="h-4 w-4" />
                              {t("form.addImageUrl")}
                            </Button>
                          </div>

                          {draftUrls.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">
                                {t("form.imageUrlPreview")} ({draftUrls.length})
                              </p>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {draftUrls.map((url) => (
                                  <div
                                    key={url}
                                    className="relative aspect-[4/3] overflow-hidden rounded-md border border-dashed border-border bg-background"
                                  >
                                    {failedDraftUrls.has(url) ? (
                                      <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
                                        {t("form.imageUrlPreviewFail")}
                                      </div>
                                    ) : (
                                      <img
                                        src={url}
                                        alt={t("form.imageUrlPreview")}
                                        className="h-full w-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={() =>
                                          setFailedDraftUrls((prev) => {
                                            const next = new Set(prev);
                                            next.add(url);
                                            return next;
                                          })
                                        }
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <p className="text-xs text-muted-foreground">{t("form.imageUrlHint")}</p>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {t("form.coverHint")}
                          {images.length > 0 ? ` · ${t("form.imageCount").replace("{count}", String(images.length))}` : ""}
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </Section>

              <Section title={t("form.section.specs")} description={isPage ? t("form.section.specsHint") : undefined}>
              <div className="grid sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bodyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.bodyType")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sedan">Sedan</SelectItem>
                          <SelectItem value="SUV">SUV</SelectItem>
                          <SelectItem value="Hatchback">Hatchback</SelectItem>
                          <SelectItem value="Coupe">Coupe</SelectItem>
                          <SelectItem value="Truck">Truck</SelectItem>
                          <SelectItem value="Van">Van</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.fuelType")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Petrol">Petrol</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                          <SelectItem value="Electric">Electric</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.color")}</FormLabel>
                      <FormControl>
                        <Input placeholder="White" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.taxStatus")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ក្រដាសពន្ធ">{t("form.taxPaper")}</SelectItem>
                          <SelectItem value="ស្លាកលេខ">{t("form.taxPlate")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.condition")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Excellent">{t("form.condExcellent")}</SelectItem>
                          <SelectItem value="Very Good">{t("form.condVeryGood")}</SelectItem>
                          <SelectItem value="Good">{t("form.condGood")}</SelectItem>
                          <SelectItem value="Fair">{t("form.condFair")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </Section>

              <Section title={t("form.section.more")} description={isPage ? t("form.section.moreHint") : undefined}>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Six-month warranty on the engine...&#10;Financing available..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{t("form.visible")}</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {t("form.visibleHint")}
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              </Section>

              <div className={`flex justify-end gap-3 ${isPage ? "rounded-xl border border-border/70 bg-card px-5 py-4 shadow-sm" : "pt-4"}`}>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("form.cancel")}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t("form.saving") : car ? t("form.save") : t("form.addCar")}
                </Button>
              </div>
            </form>
          </Form>
  );

  if (variant === "page") {
    return <div className="w-full">{formBody}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{car ? t("form.editCar") : t("form.newCar")}</DialogTitle>
        </DialogHeader>
        <div>{formBody}</div>
      </DialogContent>
    </Dialog>
  );
};

export default CarFormDialog;
