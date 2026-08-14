import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AppRole = "owner" | "admin" | "staff" | "customer";

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
  phone?: string;
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const handler = async (req: Request): Promise<Response> => {
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized — invalid token" }, 401);
    }

    const callerId = claimsData.claims.sub as string;

    const { data: adminRow, error: adminError } = await authSupabase
      .from("admin_users")
      .select("role")
      .eq("user_id", callerId)
      .maybeSingle();

    const callerRole = adminRow?.role;
    if (adminError || !callerRole || !["owner", "admin"].includes(callerRole)) {
      return json({ error: "Admin access required" }, 403);
    }

    const body = (await req.json()) as CreateUserRequest;
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const fullName = body.fullName?.trim() ?? "";
    const requestedRole = body.role ?? "admin";
    const phone = body.phone?.trim() || null;

    if (callerRole === "admin" && !["admin", "staff", "customer"].includes(requestedRole)) {
      return json({ error: "Admins can assign Admin, Staff, or Customer only" }, 403);
    }

    const role: AppRole = requestedRole;

    if (!email || !email.includes("@")) {
      return json({ error: "Valid email is required" }, 400);
    }

    if (password.length < 6) {
      return json({ error: "Password must be at least 6 characters" }, 400);
    }

    if (!fullName) {
      return json({ error: "Full name is required" }, 400);
    }

    if (!["owner", "admin", "staff", "customer"].includes(role)) {
      return json({ error: "Invalid role" }, 400);
    }

    if (callerRole !== "owner" && role === "owner") {
      return json({ error: "Only owners can assign the Owner role" }, 403);
    }

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: created, error: createError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created.user) {
      console.error("createUser error:", createError);
      const message = createError?.message ?? "Failed to create user";
      if (/already|registered|exists/i.test(message)) {
        return json({ error: "An account with this email already exists" }, 409);
      }
      return json({ error: message }, 500);
    }

    const userId = created.user.id;

    const profileUpdate: Record<string, string> = { full_name: fullName };
    if (phone) profileUpdate.phone = phone;

    const { error: profileError } = await serviceSupabase
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", userId);

    if (profileError) {
      console.error("profile update error:", profileError);
    }

    if (role === "owner" || role === "admin") {
      const { error: roleError } = await serviceSupabase
        .from("admin_users")
        .upsert({ user_id: userId, role }, { onConflict: "user_id" });

      if (roleError) {
        console.error("role upsert error:", roleError);
        return json({ error: "User created but role assignment failed" }, 500);
      }
    }

    return json({ success: true, userId, email, role });
  } catch (error) {
    console.error("create-user error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
};

serve(handler);
