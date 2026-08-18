import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { METADATA_ROLE_KEY } from "@/lib/dashboardAccess";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Create a profiles row from auth metadata when missing (survives re-login on any device). */
export async function ensureUserProfile(user: User): Promise<void> {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const full_name = text(meta.full_name) || text(meta.display_name) || null;
  const phone = text(meta.phone) || null;
  const address = text(meta.address) || null;

  const { data: existing, error: findErr } = await db
    .from("profiles")
    .select("id, full_name, phone, address")
    .eq("user_id", user.id)
    .maybeSingle();

  if (findErr) {
    console.warn("ensureUserProfile lookup:", findErr.message ?? findErr);
    return;
  }

  if (!existing) {
    const { error: insertErr } = await db.from("profiles").insert({
      user_id: user.id,
      full_name,
      phone,
      address,
    });
    if (insertErr) console.warn("ensureUserProfile insert:", insertErr.message ?? insertErr);
    return;
  }

  const patch: Record<string, string | null> = {};
  if (!text(existing.full_name) && full_name) patch.full_name = full_name;
  if (!text(existing.phone) && phone) patch.phone = phone;
  if (!text(existing.address) && address) patch.address = address;

  if (Object.keys(patch).length === 0) return;

  patch.updated_at = new Date().toISOString();
  const { error: updateErr } = await db.from("profiles").update(patch).eq("user_id", user.id);
  if (updateErr) console.warn("ensureUserProfile update:", updateErr.message ?? updateErr);
}

/** Sync profile fields to auth metadata without wiping dashboard role or other keys. */
export async function syncAuthUserMetadata(
  fields: Record<string, string | null | undefined>,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const existing = (user.user_metadata ?? {}) as Record<string, unknown>;
  const next: Record<string, unknown> = { ...existing };

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    next[key] = value ?? "";
  }

  // Never drop dashboard role when saving profile.
  if (existing[METADATA_ROLE_KEY] && next[METADATA_ROLE_KEY] === undefined) {
    next[METADATA_ROLE_KEY] = existing[METADATA_ROLE_KEY];
  }

  // Data URLs are too large for auth metadata and would fail silently.
  if (typeof next.avatar_url === "string" && next.avatar_url.startsWith("data:")) {
    next.avatar_url = existing.avatar_url ?? "";
  }
  if (typeof next.cover_url === "string" && next.cover_url.startsWith("data:")) {
    next.cover_url = existing.cover_url ?? "";
  }

  const { error } = await supabase.auth.updateUser({ data: next });
  if (error) console.warn("syncAuthUserMetadata failed:", error.message);
}

export async function bootstrapSessionUser(user: User | null | undefined): Promise<void> {
  if (!user) return;
  await ensureUserProfile(user);
}
