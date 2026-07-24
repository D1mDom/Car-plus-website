import { supabase } from "@/integrations/supabase/client";
import { safeUUID } from "@/lib/utils";

// Photos are compressed to WebP before upload so a 50MB phone original becomes a
// few hundred KB with no visible loss at the sizes this site displays. Shared by
// the car form and the team form. Images go in the public "car-images" bucket.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const BUCKET = "car-images";
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

export const compressImage = async (
  file: File,
): Promise<{ blob: Blob; extension: string }> => {
  if (file.type === "image/gif") return { blob: file, extension: "gif" };

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

  if (!blob) return { blob: file, extension: file.name.split(".").pop() || "jpg" };
  return { blob, extension: "webp" };
};

// Compresses, uploads to the bucket, and returns the public URL.
export const uploadImage = async (file: File): Promise<string> => {
  const { blob, extension } = await compressImage(file);
  const path = `${safeUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
