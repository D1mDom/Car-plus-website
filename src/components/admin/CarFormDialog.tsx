import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  price: z.coerce.number().positive("តម្លៃត្រូវតែធំជាង ០ (សូមបញ្ចូលតម្លៃ)"),
  status: z.enum(["ready", "onroad", "luxury", "plate"]),
  viewers: z.coerce.number().min(0).default(0),
  images: z.array(z.string()).min(1, "សូមបញ្ចូលរូបភាពយ៉ាងតិចមួយ"),
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
}

const CarFormDialog = ({ open, onOpenChange, car }: CarFormDialogProps) => {
  const createCar = useCreateCar();
  const updateCar = useUpdateCar();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
      taxStatus: "Tax slip",
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
        taxStatus: "Tax slip",
        condition: "Excellent",
        fuelType: "Petrol",
        color: "White",
        description: "",
        isActive: true,
      });
    }
  }, [car, form]);

  // Uploads to the car-images bucket and returns its public URL. The image
  // column stores that URL, not the file itself — embedding base64 here would
  // put megabytes into every car row and re-download them on each page load.
  const uploadImage = async (file: File): Promise<string> => {
    const { blob, extension } = await compressImage(file);
    const path = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(CAR_IMAGES_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(CAR_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  // Upload one or more files, appending each resulting URL to the images array.
  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    setIsUploading(true);
    try {
      for (const file of arr) {
        if (!file.type.startsWith("image/")) {
          toast.error("Please select an image file");
          continue;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          toast.error("Image must be less than 50MB");
          continue;
        }
        const publicUrl = await uploadImage(file);
        const current = form.getValues("images") || [];
        form.setValue("images", [...current, publicUrl], { shouldValidate: true });
      }
      toast.success("Image uploaded successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      toast.error(message);
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

  const isLoading = createCar.isPending || updateCar.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4 text-left">
          <SheetTitle>{car ? "កែសម្រួលឡាន" : "បន្ថែមឡានថ្មី"}</SheetTitle>
        </SheetHeader>
        <div className="px-6 py-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>លេខកូដ</FormLabel>
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
                      <FormLabel>ឈ្មោះ</FormLabel>
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
                      <FormLabel>ម៉ូដែល</FormLabel>
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
                      <FormLabel>ឆ្នាំ</FormLabel>
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
                      <FormLabel>តម្លៃ ($)</FormLabel>
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
                      <FormLabel>ស្ថានភាព</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ready">ឡានរួចរាល់</SelectItem>
                          <SelectItem value="onroad">ឡានលើផ្លូវ</SelectItem>
                          <SelectItem value="luxury">ឡានប្រណីត</SelectItem>
                          <SelectItem value="plate">មានស្លាកលេខ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="images"
                render={() => (
                  <FormItem>
                    <FormLabel>រូបភាពឡាន (អាចដាក់ច្រើន)</FormLabel>
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

                        <div className="grid grid-cols-3 gap-3">
                          {images.map((url, i) => (
                            <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-border">
                              <img src={url} alt={`រូបភាព ${i + 1}`} className="h-full w-full object-cover" />
                              {i === 0 && (
                                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                  គម្រប
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImageAt(i)}
                                aria-label="លុបរូបភាព"
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
                                <p className="text-xs text-muted-foreground">បន្ថែមរូបភាព</p>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          រូបទី ១ គឺជារូបគម្រប។ PNG, JPG, WEBP (រហូតដល់ 50MB)
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bodyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ប្រភេទតួ</FormLabel>
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
                      <FormLabel>ប្រភេទឥន្ធនៈ</FormLabel>
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
                      <FormLabel>ពណ៌</FormLabel>
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
                      <FormLabel>ស្ថានភាពពន្ធ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Tax slip">ស្លាកពន្ធ</SelectItem>
                          <SelectItem value="Tax paid">បង់ពន្ធរួច</SelectItem>
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
                      <FormLabel>គុណភាព</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Excellent">ល្អឥតខ្ចោះ</SelectItem>
                          <SelectItem value="Very Good">ល្អណាស់</SelectItem>
                          <SelectItem value="Good">ល្អ</SelectItem>
                          <SelectItem value="Fair">មធ្យម</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ការពិពណ៌នា (មួយចំណុចក្នុងមួយបន្ទាត់)</FormLabel>
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
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>បង្ហាញ</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        បង្ហាញឡាននេះនៅលើគេហទំព័រ
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  បោះបង់
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "កំពុងរក្សាទុក..." : car ? "រក្សាទុក" : "បន្ថែមឡាន"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CarFormDialog;
