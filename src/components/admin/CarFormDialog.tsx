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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  price: z.coerce.number().min(0),
  status: z.enum(["ready", "onroad", "luxury", "plate"]),
  viewers: z.coerce.number().min(0).default(0),
  image: z.string().min(1, "Image is required"),
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      image: "",
      bodyType: "Sedan",
      taxStatus: "Tax slip",
      condition: "Excellent",
      fuelType: "Petrol",
      color: "White",
      description: "",
      isActive: true,
    },
  });

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
        image: car.image,
        bodyType: car.bodyType,
        taxStatus: car.taxStatus,
        condition: car.condition,
        fuelType: car.fuelType,
        color: car.color,
        description: car.description.join("\n"),
        isActive: car.isActive ?? true,
      });
      setImagePreview(car.image);
    } else {
      form.reset({
        code: "",
        name: "",
        model: "",
        year: new Date().getFullYear(),
        price: 0,
        status: "ready",
        viewers: 0,
        image: "",
        bodyType: "Sedan",
        taxStatus: "Tax slip",
        condition: "Excellent",
        fuelType: "Petrol",
        color: "White",
        description: "",
        isActive: true,
      });
      setImagePreview(null);
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

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image must be less than 50MB");
      return;
    }

    // Show the local file immediately so the dialog isn't blank while a large
    // upload runs; swapped for the storage URL once it lands.
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setIsUploading(true);

    try {
      const publicUrl = await uploadImage(file);
      setImagePreview(publicUrl);
      form.setValue("image", publicUrl, { shouldValidate: true });
      toast.success("Image uploaded successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload image";
      toast.error(message);
      setImagePreview(null);
      form.setValue("image", "", { shouldValidate: true });
    } finally {
      URL.revokeObjectURL(localPreview);
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("image", "", { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (values: FormValues) => {
    const carData = {
      ...values,
      images: [values.image],
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{car ? "Edit Car" : "Add New Car"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
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
                      <FormLabel>Name</FormLabel>
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
                      <FormLabel>Model</FormLabel>
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
                      <FormLabel>Year</FormLabel>
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
                      <FormLabel>Price ($)</FormLabel>
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ready">Ready car</SelectItem>
                          <SelectItem value="onroad">On-road car</SelectItem>
                          <SelectItem value="luxury">Luxury car</SelectItem>
                          <SelectItem value="plate">With licence plate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="image"
                render={() => (
                  <FormItem>
                    <FormLabel>Car Image</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                        />

                        {/* Preview or Upload Area */}
                        {imagePreview ? (
                          <div className="relative group rounded-lg overflow-hidden border-2 border-border">
                            <img
                              src={imagePreview}
                              alt="Car preview"
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                              >
                                Change
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={removeImage}
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {isUploading && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                              isDragging
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                              </>
                            ) : (
                              <>
                                <div className="rounded-full bg-muted p-3 mb-3">
                                  <Upload className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</p>
                              </>
                            )}
                          </div>
                        )}
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
                      <FormLabel>Body Type</FormLabel>
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
                      <FormLabel>Fuel Type</FormLabel>
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
                      <FormLabel>Color</FormLabel>
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
                      <FormLabel>Tax Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Tax slip">Tax slip</SelectItem>
                          <SelectItem value="Tax paid">Tax paid</SelectItem>
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
                      <FormLabel>Condition</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Very Good">Very Good</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
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
                    <FormLabel>Description (one point per line)</FormLabel>
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
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Show this car on the public website
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
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : car ? "Update Car" : "Add Car"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CarFormDialog;
