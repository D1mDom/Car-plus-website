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

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return json({ error: "No image file provided" }, 400);
    }

    if (!file.type.startsWith("image/")) {
      return json({ error: "File must be an image" }, 400);
    }

    if (file.size > MAX_BYTES) {
      return json({ error: "Image is too large (max 50MB)" }, 400);
    }

    const ext = file.type === "image/png"
      ? "png"
      : file.type === "image/gif"
      ? "gif"
      : file.type === "image/jpeg"
      ? "jpg"
      : "webp";

    const path = `avatars/${user.id}/${crypto.randomUUID()}.${ext}`;
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: uploadError } = await serviceSupabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("upload-avatar storage error:", uploadError);
      return json({ error: uploadError.message }, 500);
    }

    const { data: urlData } = serviceSupabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    const { data: existingProfile } = await serviceSupabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingProfile?.id) {
      const { error: profileError } = await serviceSupabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (profileError) {
        console.error("upload-avatar profile update error:", profileError);
      }
    } else {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const full_name =
        typeof meta.full_name === "string"
          ? meta.full_name
          : typeof meta.display_name === "string"
          ? meta.display_name
          : null;
      const phone = typeof meta.phone === "string" ? meta.phone : null;

      const { error: profileError } = await serviceSupabase.from("profiles").insert({
        user_id: user.id,
        full_name,
        phone,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("upload-avatar profile insert error:", profileError);
      }
    }

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    await serviceSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, avatar_url: publicUrl },
    });

    return json({ url: publicUrl });
  } catch (error) {
    console.error("upload-avatar error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
