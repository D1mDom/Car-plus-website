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

/** Convert any image to PNG on a solid white background — used for brand logos. */
export const compressImageAsPng = async (
  file: File,
): Promise<{ blob: Blob; extension: "png" }> => {
  const img = await loadImage(file);
  const maxDim = 512; // logos stay sharp at smaller size
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if (file.type === "image/png") return { blob: file, extension: "png" };
    throw new Error("Could not convert image to PNG");
  }

  // Solid white behind logo (no transparency / checkerboard on site)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );

  if (!blob) throw new Error("Could not convert image to PNG");
  return { blob, extension: "png" };
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

/** Upload a brand logo as PNG (from JPG/WebP/PNG/SVG-rendered canvas input). */
export const uploadBrandLogo = async (file: File): Promise<string> => {
  const { blob, extension } = await compressImageAsPng(file);
  const path = `brands/${safeUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/png", upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

/** Upload a profile photo under avatars/{userId}/ or covers/{userId}/ */
const uploadProfileImageDirect = async (
  userId: string,
  folder: "avatars" | "covers",
  blob: Blob,
  extension: string,
): Promise<string> => {
  const path = `${folder}/${userId}/${safeUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
};

const uploadProfileAvatarDirect = async (userId: string, blob: Blob, extension: string) =>
  uploadProfileImageDirect(userId, "avatars", blob, extension);

const uploadProfileCoverDirect = async (userId: string, blob: Blob, extension: string) =>
  uploadProfileImageDirect(userId, "covers", blob, extension);

const uploadViaEdgeFunction = async (file: File, kind: "avatar" | "cover"): Promise<string> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not signed in");

  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: form,
  });

  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !body.url) {
    throw new Error(body.error || "Could not upload photo");
  }
  return body.url;
};

const uploadProfileImage = async (
  userId: string,
  file: File,
  kind: "avatar" | "cover",
): Promise<string> => {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image is too large (max 50MB)");
  }
  const { blob, extension } = await compressImage(file);
  const uploadDirect = kind === "avatar" ? uploadProfileAvatarDirect : uploadProfileCoverDirect;
  const compressed = new File([blob], `photo.${extension}`, {
    type: blob.type || "image/webp",
  });

  try {
    return await uploadDirect(userId, blob, extension);
  } catch (directError) {
    try {
      return await uploadViaEdgeFunction(compressed, kind);
    } catch {
      throw directError instanceof Error ? directError : new Error("Could not upload photo");
    }
  }
};

export const uploadProfileAvatar = async (userId: string, file: File): Promise<string> =>
  uploadProfileImage(userId, file, "avatar");

export const uploadProfileCover = async (userId: string, file: File): Promise<string> =>
  uploadProfileImage(userId, file, "cover");
