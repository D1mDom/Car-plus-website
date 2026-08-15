import { useEffect, useState, useRef, forwardRef, memo, useImperativeHandle, type ReactNode, type MutableRefObject } from "react";
import { useForm, useWatch, useFormContext, type Control, type FieldErrors } from "react-hook-form";
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
import { useCreateCar, useUpdateCar, useCars, type Car, type CarStatus, type CarOrigin } from "@/hooks/useCars";
import { Upload, X, Loader2, Link2, Car, ImageIcon, Settings2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { safeUUID, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { onImgError } from "@/lib/imageFallback";
import { generateNextCarCode } from "@/lib/carCodeUtils";
import type { TranslationKey } from "@/i18n/translations";

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
  origin: z.enum(["local", "thai", "import"]).default("local"),
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

function useDebouncedValue<T>(value: T, delay = 280): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Commits local text to react-hook-form (used before submit). */
export type FlushableInputHandle = { flush: () => void };

/** Local text while typing; commits to form on blur only (keeps inputs responsive). */
const PriceInput = forwardRef<
  FlushableInputHandle,
  { value: number; onChange: (value: number) => void; onBlur: () => void }
>(({ value, onChange, onBlur }, ref) => {
  const [text, setText] = useState(() => (value > 0 ? String(value) : ""));

  useEffect(() => {
    setText(value > 0 ? String(value) : "");
  }, [value]);

  useImperativeHandle(
    ref,
    () => ({
      flush: () => {
        const n = text === "" ? 0 : Number(text);
        onChange(n);
      },
    }),
    [text, onChange],
  );

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="25000"
        className="pl-7 tabular-nums"
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={() => {
          const n = text === "" ? 0 : Number(text);
          onChange(n);
          onBlur();
        }}
      />
    </div>
  );
});
PriceInput.displayName = "PriceInput";

const YearInput = forwardRef<
  FlushableInputHandle,
  { value: number; onChange: (value: number) => void; onBlur: () => void }
>(({ value, onChange, onBlur }, ref) => {
  const [text, setText] = useState(() => (value > 0 ? String(value) : ""));

  useEffect(() => {
    setText(value > 0 ? String(value) : "");
  }, [value]);

  useImperativeHandle(
    ref,
    () => ({
      flush: () => {
        const n = text === "" ? new Date().getFullYear() : Number(text);
        onChange(n);
      },
    }),
    [text, onChange],
  );

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={4}
      className="tabular-nums"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
      onBlur={() => {
        const n = text === "" ? new Date().getFullYear() : Number(text);
        onChange(n);
        onBlur();
      }}
    />
  );
});
YearInput.displayName = "YearInput";

function CarFormPreview({ control }: { control: Control<FormValues> }) {
  const { t } = useLanguage();
  const [name, price, year, status, code, isActive, bodyType, fuelType, images] = useWatch({
    control,
    name: ["name", "price", "year", "status", "code", "isActive", "bodyType", "fuelType", "images"],
  });

  const debouncedName = useDebouncedValue(name);
  const debouncedPrice = useDebouncedValue(price);
  const debouncedCode = useDebouncedValue(code);
  const debouncedYear = useDebouncedValue(year);

  return (
    <Card className="sticky top-24 border-border/70 shadow-sm lg:top-28">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("admin.addCar.previewTitle")}</CardTitle>
        <CardDescription>{t("admin.addCar.previewDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
          {images?.[0] ? (
            <img
              src={images[0]}
              alt=""
              onError={onImgError}
              className="aspect-[4/3] w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <p className="text-xs">{t("admin.addCar.previewNoPhoto")}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {debouncedCode ? (
            <p className="font-mono text-[11px] text-muted-foreground">{debouncedCode}</p>
          ) : null}
          <p className="font-heading text-lg font-semibold leading-tight text-foreground">
            {debouncedName || t("admin.addCar.previewName")}
          </p>
          <p className="font-heading text-2xl font-bold text-primary tabular-nums">
            {debouncedPrice && debouncedPrice > 0
              ? `$${Number(debouncedPrice).toLocaleString()}`
              : "—"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {status ? (
              <Badge variant="secondary">{t(`status.${status}` as TranslationKey)}</Badge>
            ) : null}
            {debouncedYear ? <Badge variant="outline">{debouncedYear}</Badge> : null}
            {bodyType ? <Badge variant="outline">{bodyType}</Badge> : null}
            {fuelType ? <Badge variant="outline">{fuelType}</Badge> : null}
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? t("admin.cars.visible") : t("admin.cars.hidden")}
            </Badge>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {t("admin.addCar.previewNote")}
        </p>
      </CardContent>
    </Card>
  );
}

const MemoCarFormPreview = memo(CarFormPreview);

const BODY_TYPES = ["Sedan", "SUV", "Hatchback", "Coupe", "Truck", "Van"] as const;
const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"] as const;
const CONDITIONS = ["Excellent", "Very Good", "Good", "Fair"] as const;

const ColorInput = forwardRef<
  FlushableInputHandle,
  { value: string; onChange: (value: string) => void; onBlur: () => void }
>(({ value, onChange, onBlur }, ref) => {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  useImperativeHandle(
    ref,
    () => ({
      flush: () => {
        onChange(text.trim() || text);
      },
    }),
    [text, onChange],
  );

  return (
    <Input
      autoComplete="off"
      placeholder="White"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        onChange(text.trim() || text);
        onBlur();
      }}
    />
  );
});
ColorInput.displayName = "ColorInput";

function SpecPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          size="sm"
          variant={value === opt.value ? "default" : "outline"}
          className="rounded-full"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

const SpecSelect = forwardRef<
  HTMLButtonElement,
  {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    placeholder?: string;
    children: ReactNode;
  }
>(({ value, onChange, onBlur, placeholder, children }, ref) => (
  <Select
    value={value}
    onValueChange={(v) => {
      onChange(v);
      onBlur();
    }}
  >
    <FormControl>
      <SelectTrigger ref={ref}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
    </FormControl>
    <SelectContent>{children}</SelectContent>
  </Select>
));
SpecSelect.displayName = "SpecSelect";

/** Specs isolated so typing color does not re-render the whole form. */
export type CarSpecsSectionHandle = { flushPending: () => void };

const CarSpecsSection = memo(
  forwardRef<
    CarSpecsSectionHandle,
    { control: Control<FormValues>; isPage: boolean; formResetKey: number }
  >(function CarSpecsSection({ control, isPage, formResetKey }, ref) {
  const { t } = useLanguage();
  const colorFlushRef = useRef<FlushableInputHandle>(null);

  useImperativeHandle(ref, () => ({
    flushPending: () => colorFlushRef.current?.flush(),
  }));

  const bodyOptions = BODY_TYPES.map((v) => ({ value: v, label: v }));
  const fuelOptions = FUEL_TYPES.map((v) => ({ value: v, label: v }));
  const taxOptions = [
    { value: "ក្រដាសពន្ធ", label: t("form.taxPaper") },
    { value: "ស្លាកលេខ", label: t("form.taxPlate") },
  ];
  const conditionOptions = [
    { value: "Excellent", label: t("form.condExcellent") },
    { value: "Very Good", label: t("form.condVeryGood") },
    { value: "Good", label: t("form.condGood") },
    { value: "Fair", label: t("form.condFair") },
  ];

  const fieldGrid = isPage ? "grid gap-4" : "grid sm:grid-cols-3 gap-4";
  const fieldItemClass = "min-w-0";

  return (
    <>
      <div className={fieldGrid}>
        <FormField
          control={control}
          name="bodyType"
          render={({ field }) => (
            <FormItem className={fieldItemClass}>
              <FormLabel>{t("form.bodyType")}</FormLabel>
              {isPage ? (
                <SpecPills value={field.value} onChange={field.onChange} options={bodyOptions} />
              ) : (
                <SpecSelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
                  {BODY_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SpecSelect>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="fuelType"
          render={({ field }) => (
            <FormItem className={fieldItemClass}>
              <FormLabel>{t("form.fuelType")}</FormLabel>
              {isPage ? (
                <SpecPills value={field.value} onChange={field.onChange} options={fuelOptions} />
              ) : (
                <SpecSelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
                  {FUEL_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SpecSelect>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="color"
          render={({ field }) => (
            <FormItem className={fieldItemClass}>
              <FormLabel>{t("form.color")}</FormLabel>
              <FormControl>
                <ColorInput
                  key={`color-${formResetKey}`}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={colorFlushRef}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className={isPage ? "grid gap-4" : "grid sm:grid-cols-2 gap-4"}>
        <FormField
          control={control}
          name="taxStatus"
          render={({ field }) => (
            <FormItem className={fieldItemClass}>
              <FormLabel>{t("form.taxStatus")}</FormLabel>
              {isPage ? (
                <SpecPills value={field.value} onChange={field.onChange} options={taxOptions} />
              ) : (
                <SpecSelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
                  {taxOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SpecSelect>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="condition"
          render={({ field }) => (
            <FormItem className={fieldItemClass}>
              <FormLabel>{t("form.condition")}</FormLabel>
              {isPage ? (
                <SpecPills value={field.value} onChange={field.onChange} options={conditionOptions} />
              ) : (
                <SpecSelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
                  {conditionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SpecSelect>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}),
);

function parseImageUrls(raw: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  // One URL per line — do not split on commas (breaks CDN URLs and pasted links).
  for (const part of raw.split(/\n+/)) {
    const url = part.trim().replace(/[,;]+$/, "");
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
}

/** Photo upload isolated so typing in other fields does not re-render this block. */
export type CarPhotosSectionHandle = { flushPendingUrls: () => void };

const CarPhotosSection = memo(
  forwardRef<
    CarPhotosSectionHandle,
    { control: Control<FormValues>; isPage: boolean; pendingUrlRef: MutableRefObject<string> }
  >(function CarPhotosSection({ control, isPage, pendingUrlRef }, ref) {
  const { t } = useLanguage();
  const { setValue, getValues } = useFormContext<FormValues>();
  const images = useWatch({ control, name: "images" }) || [];
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrlState] = useState(() => pendingUrlRef.current);
  const [failedDraftUrls, setFailedDraftUrls] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setImageUrl = (value: string) => {
    pendingUrlRef.current = value;
    setImageUrlState(value);
  };

  const draftUrls = parseImageUrls(imageUrl);

  const uploadImageFile = async (file: File): Promise<string> => {
    const { blob, extension } = await compressImage(file);
    const path = `${safeUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(CAR_IMAGES_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(CAR_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

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
          const publicUrl = await uploadImageFile(file);
          const current = getValues("images") || [];
          setValue("images", [...current, publicUrl], { shouldValidate: false });
          uploaded++;
        } catch (err) {
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

  const removeImageAt = (index: number) => {
    const current = getValues("images") || [];
    setValue(
      "images",
      current.filter((_, i) => i !== index),
      { shouldValidate: false },
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
    const current = getValues("images") || [];
    const currentSet = new Set(current);
    const fresh = parsed.filter((url) => !currentSet.has(url));
    if (fresh.length === 0) {
      toast.error(t("form.imageUrlDuplicate"));
      return;
    }
    setValue("images", [...current, ...fresh], { shouldValidate: false });
    setImageUrl("");
    setFailedDraftUrls(new Set());
    toast.success(
      fresh.length === 1
        ? t("form.imageUrlAdded")
        : t("form.imageUrlAddedMany").replace("{count}", String(fresh.length)),
    );
  };

  useImperativeHandle(ref, () => ({
    flushPendingUrls: () => {
      const parsed = parseImageUrls(imageUrl);
      if (parsed.length === 0) return;
      const current = getValues("images") || [];
      const currentSet = new Set(current);
      const fresh = parsed.filter((url) => !currentSet.has(url));
      if (fresh.length === 0) return;
      setValue("images", [...current, ...fresh], { shouldValidate: false });
      setImageUrl("");
      setFailedDraftUrls(new Set());
    },
  }));

  return (
    <FormField
      control={control}
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
                  if (e.target.files?.length) void handleFiles(e.target.files);
                }}
              />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={url}
                      alt={`${t("form.photos")} ${i + 1}`}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
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
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
                    isPage ? "col-span-full min-h-[140px] py-8" : "aspect-[4/3]",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                  )}
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
                  <Button type="button" variant="outline" className="shrink-0 gap-1.5" onClick={addImageFromUrl}>
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
  );
}),
);

interface CarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: Car | null;
  /** Render as a full page form instead of a modal dialog. */
  variant?: "dialog" | "page";
  /** Page mode: stay open after create and pass the new car back. */
  onCreated?: (car: Car) => void;
}

const defaultFormValues: FormValues = {
  code: "",
  name: "",
  model: "",
  year: new Date().getFullYear(),
  price: 0,
  status: "ready",
  origin: "local" as CarOrigin,
  viewers: 0,
  images: [],
  bodyType: "Sedan",
  taxStatus: "Tax paper",
  condition: "Excellent",
  fuelType: "Petrol",
  color: "White",
  description: "",
  isActive: true,
};

const CarFormDialog = ({ open, onOpenChange, car, variant = "dialog", onCreated }: CarFormDialogProps) => {
  const createCar = useCreateCar();
  const updateCar = useUpdateCar();
  const { data: allCars = [] } = useCars();
  const [formResetKey, setFormResetKey] = useState(0);
  const photosRef = useRef<CarPhotosSectionHandle>(null);
  const pendingImageUrlRef = useRef("");
  const specsRef = useRef<CarSpecsSectionHandle>(null);
  const priceRef = useRef<FlushableInputHandle>(null);
  const yearRef = useRef<FlushableInputHandle>(null);
  const { t } = useLanguage();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const resetForNewCar = () => {
    pendingImageUrlRef.current = "";
    form.reset(defaultFormValues);
    setFormResetKey((k) => k + 1);
  };

  const carId = car?.id ?? null;

  useEffect(() => {
    if (car) {
      pendingImageUrlRef.current = "";
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
        origin: car.origin ?? "local",
      });
      setFormResetKey((k) => k + 1);
    } else if (open) {
      pendingImageUrlRef.current = "";
      const nextCode = generateNextCarCode(allCars);
      form.reset({ ...defaultFormValues, code: nextCode });
      setFormResetKey((k) => k + 1);
    }
    // Only re-sync when opening the dialog or switching the car being edited.
    // Do NOT depend on `form` — that re-runs on field changes and wipes photos/URLs.
  }, [carId, open]);

  const onSubmit = (values: FormValues) => {
    const carData = {
      ...values,
      image: values.images[0],
      description: values.description.split("\n").filter(Boolean),
      origin: values.origin as CarOrigin,
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
        onSuccess: (newCar) => {
          if (isPage && onCreated) {
            onCreated(newCar);
            resetForNewCar();
          } else {
            onOpenChange(false);
          }
        },
      });
    }
  };

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    const first = Object.values(errors).find(
      (e) => e && typeof e === "object" && "message" in e && e.message,
    );
    toast.error(first?.message ? String(first.message) : t("form.validationFailed"));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    priceRef.current?.flush();
    yearRef.current?.flush();
    specsRef.current?.flushPending();
    photosRef.current?.flushPendingUrls();
    requestAnimationFrame(() => {
      void form.handleSubmit(onSubmit, onInvalid)();
    });
  };

  const isLoading = createCar.isPending || updateCar.isPending;
  const isPage = variant === "page";

  const previewPanel = isPage ? <MemoCarFormPreview control={form.control} /> : null;

  const Section = ({
    title,
    description,
    icon: Icon,
    children,
  }: {
    title: string;
    description?: string;
    icon?: typeof Car;
    children: ReactNode;
  }) =>
    isPage ? (
      <section className="overflow-visible rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="flex items-start gap-3 border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
          {Icon ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#174080]/10 text-[#174080]">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        <div className="space-y-4 p-5 sm:p-6">{children}</div>
      </section>
    ) : (
      <div className="space-y-4">{children}</div>
    );

  const statusPills = (field: { value: CarStatus; onChange: (v: CarStatus) => void }) => (
    <div className="flex flex-wrap gap-2">
      {(["ready", "onroad", "luxury", "plate"] as const).map((s) => (
        <Button
          key={s}
          type="button"
          size="sm"
          variant={field.value === s ? "default" : "outline"}
          className="rounded-full"
          onClick={() => field.onChange(s)}
        >
          {t(`status.${s}` as TranslationKey)}
        </Button>
      ))}
    </div>
  );

  const formBody = (
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className={isPage ? "space-y-5" : "space-y-4"}>
              <Section
                title={t("form.section.basic")}
                description={isPage ? t("form.section.basicHint") : undefined}
                icon={Car}
              >
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.code")}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="CP2026-001" {...field} />
                        </FormControl>
                        {!car && (
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => field.onChange(generateNextCarCode(allCars))}
                          >
                            {t("form.generateCode")}
                          </Button>
                        )}
                      </div>
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
                        <YearInput
                          key={`year-${formResetKey}`}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          ref={yearRef}
                        />
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
                        <PriceInput
                          key={`price-${formResetKey}`}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          ref={priceRef}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className={isPage ? "sm:col-span-2" : undefined}>
                      <FormLabel>{t("form.status")}</FormLabel>
                      <FormControl>
                        {isPage ? statusPills(field) : (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ready">{t("status.ready")}</SelectItem>
                            <SelectItem value="onroad">{t("status.onroad")}</SelectItem>
                            <SelectItem value="luxury">{t("status.luxury")}</SelectItem>
                            <SelectItem value="plate">{t("status.plate")}</SelectItem>
                          </SelectContent>
                        </Select>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem className={isPage ? "sm:col-span-2" : undefined}>
                      <FormLabel>{t("form.origin")}</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">{t("form.origin.local")}</SelectItem>
                            <SelectItem value="thai">{t("form.origin.thai")}</SelectItem>
                            <SelectItem value="import">{t("form.origin.import")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </Section>

              <Section
                title={t("form.section.photos")}
                description={isPage ? t("form.section.photosHint") : undefined}
                icon={ImageIcon}
              >
              <CarPhotosSection ref={photosRef} control={form.control} isPage={isPage} pendingUrlRef={pendingImageUrlRef} />
              </Section>

              <Section
                title={t("form.section.specs")}
                description={isPage ? t("form.section.specsHint") : undefined}
                icon={Settings2}
              >
              <CarSpecsSection ref={specsRef} control={form.control} isPage={isPage} formResetKey={formResetKey} />
              </Section>

              <Section
                title={t("form.section.more")}
                description={isPage ? t("form.section.moreHint") : undefined}
                icon={FileText}
              >
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

              <div
                className={cn(
                  "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
                  isPage &&
                    "sticky bottom-0 z-10 -mx-1 rounded-xl border border-border/70 bg-card/95 px-5 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80",
                )}
              >
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
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <div className="lg:hidden">{previewPanel}</div>
          {formBody}
        </div>
        <aside className="hidden lg:block">{previewPanel}</aside>
      </div>
    );
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
