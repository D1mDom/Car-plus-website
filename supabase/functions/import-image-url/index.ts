import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const MAX_BYTES = 50 * 1024 * 1024;
const BUCKET = "car-images";
const PRIVATE_HOST =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|\[::1\])/i;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing or invalid authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();
    if (userError || !user) {
      return json({ error: "Unauthorized — sign in again" }, 401);
    }

    const body = (await req.json().catch(() => ({}))) as { url?: string };
    const sourceUrl = typeof body.url === "string" ? body.url.trim() : "";
    let parsed: URL;
    try {
      parsed = new URL(sourceUrl);
    } catch {
      return json({ error: "Enter a valid http(s) image URL" }, 400);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return json({ error: "Enter a valid http(s) image URL" }, 400);
    }
    if (PRIVATE_HOST.test(parsed.hostname)) {
      return json({ error: "That image URL cannot be imported" }, 400);
    }

    const remote = await fetch(sourceUrl, {
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; CarPlus/1.0)",
      },
    });
    if (!remote.ok) {
      return json(
        { error: "Could not download that image — upload the file instead" },
        400,
      );
    }

    const contentType = (remote.headers.get("content-type") || "").split(";")[0].trim();
    if (contentType && !contentType.startsWith("image/") && contentType !== "application/octet-stream") {
      return json({ error: "That URL is not an image" }, 400);
    }

    const bytes = new Uint8Array(await remote.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) {
      return json({ error: "Image is too large (max 50MB)" }, 400);
    }

    const ext = contentType === "image/png"
      ? "png"
      : contentType === "image/gif"
      ? "gif"
      : contentType === "image/jpeg"
      ? "jpg"
      : "webp";
    const path = `${crypto.randomUUID()}.${ext}`;
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error: uploadError } = await serviceSupabase.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: contentType.startsWith("image/") ? contentType : `image/${ext}`,
        upsert: false,
      });
    if (uploadError) {
      return json({ error: uploadError.message }, 500);
    }

    const { data } = serviceSupabase.storage.from(BUCKET).getPublicUrl(path);
    return json({ url: data.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
