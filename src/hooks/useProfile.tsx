import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadProfileAvatar, uploadProfileCover } from "@/lib/imageUpload";
import { syncAuthUserMetadata, ensureUserProfile } from "@/lib/userProfileBootstrap";

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  telegram: string | null;
  preferred_time: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInput = {
  full_name: string;
  phone: string;
  address: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  telegram?: string;
  preferred_time?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

const errMessage = (e: unknown) => {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === "object" && "message" in e && (e as { message: unknown }).message) {
    return String((e as { message: unknown }).message);
  }
  return "Unknown error";
};

const EXTRA_PROFILE_COLS = ["avatar_url", "cover_url", "telegram", "preferred_time"] as const;

const missingExtraCols = (e: unknown): string[] => {
  const m = errMessage(e).toLowerCase();
  if (!(m.includes("column") || m.includes("schema cache") || m.includes("could not find"))) {
    return [];
  }
  return EXTRA_PROFILE_COLS.filter((col) => m.includes(col));
};

const normalizePhotoUrl = (value: unknown): string => {
  const raw = text(value);
  if (!raw) return "";
  const noHash = raw.split("#")[0];
  const noQuery = noHash.split("?")[0];
  return noQuery.replace(/\/+$/, "");
};

const urlsMatch = (a: string | null, b: unknown) => normalizePhotoUrl(a) === normalizePhotoUrl(b);

const normalizeTelegram = (value?: string | null) => {
  const v = (value ?? "").trim();
  if (!v) return "";
  const handle = v.replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  return handle ? `@${handle}` : "";
};

const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const mapRow = (row: Record<string, unknown>, meta: Record<string, unknown> = {}): Profile => {
  const full_name =
    text(row.full_name) || text(meta.full_name) || text(meta.display_name) || null;
  const phone = text(row.phone) || text(meta.phone) || null;

  return {
    id: String(row.id ?? ""),
    user_id: String(row.user_id ?? ""),
    full_name,
    phone,
    address: text(row.address) || null,
    avatar_url: text(row.avatar_url) || text(meta.avatar_url) || null,
    cover_url: text(row.cover_url) || text(meta.cover_url) || null,
    telegram: text(row.telegram) || text(meta.telegram) || null,
    preferred_time: text(row.preferred_time) || text(meta.preferred_time) || null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
};

/** Keep auth metadata in sync so header / order form see name + phone immediately. */
const syncAuthMeta = async (input: {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  telegram: string | null;
  preferred_time: string | null;
}) => {
  await syncAuthUserMetadata({
    full_name: input.full_name ?? "",
    phone: input.phone ?? "",
    avatar_url: input.avatar_url ?? "",
    cover_url: input.cover_url ?? "",
    telegram: input.telegram ?? "",
    preferred_time: input.preferred_time ?? "",
  });
};

/**
 * Save core profile fields. Tries full payload first; if extra columns are missing
 * on older DBs, retries with name/phone/address only.
 */
const persistProfile = async (
  userId: string,
  fields: {
    full_name: string | null;
    phone: string | null;
    address: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    telegram: string | null;
    preferred_time: string | null;
  },
  previous: { avatar_url: string | null; cover_url: string | null }
) => {
  const updated_at = new Date().toISOString();

  const { data: existing, error: findErr } = await db
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (findErr) throw findErr;

  const tryWrite = async (payload: Record<string, unknown>) => {
    if (existing?.id) {
      // Do not send user_id on UPDATE — only filter by it
      const { data, error } = await db
        .from("profiles")
        .update(payload)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Could not update profile (no row returned)");
      return data as Record<string, unknown>;
    }

    const { data, error } = await db
      .from("profiles")
      .insert({ ...payload, user_id: userId })
      .select("*")
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  };

  const tryWriteOmittingMissing = async (
    payload: Record<string, unknown>,
  ): Promise<{ row: Record<string, unknown>; written: Record<string, unknown> }> => {
    try {
      return { row: await tryWrite(payload), written: payload };
    } catch (e) {
      const missing = missingExtraCols(e);
      if (missing.length === 0) throw e;
      const next = { ...payload };
      for (const col of missing) delete next[col];
      if (Object.keys(next).length === Object.keys(payload).length) throw e;
      return tryWriteOmittingMissing(next);
    }
  };

  const fullPayload = {
    full_name: fields.full_name,
    phone: fields.phone,
    address: fields.address,
    avatar_url: fields.avatar_url,
    cover_url: fields.cover_url,
    telegram: fields.telegram,
    preferred_time: fields.preferred_time,
    updated_at,
  };

  const { row, written } = await tryWriteOmittingMissing(fullPayload);

  const photoPersisted = (key: "avatar_url" | "cover_url", wanted: string | null) => {
    // Photo was not changed — never block the rest of the profile save.
    if (urlsMatch(wanted, previous[key])) return true;
    if (key in written) return urlsMatch(wanted, row[key]);
    // Older databases may not have this column.
    if (!wanted) return true;
    return false;
  };

  if (!photoPersisted("avatar_url", fields.avatar_url)) {
    throw new Error("PHOTO_PERSIST_FAIL");
  }
  if (!photoPersisted("cover_url", fields.cover_url)) {
    throw new Error("PHOTO_PERSIST_FAIL");
  }

  return row;
};

export const useProfile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      await ensureUserProfile(user);
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

      const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return {
          id: "",
          user_id: user.id,
          full_name: text(meta.full_name) || text(meta.display_name) || null,
          phone: text(meta.phone) || null,
          address: null,
          avatar_url: text(meta.avatar_url) || null,
          cover_url: text(meta.cover_url) || null,
          telegram: text(meta.telegram) || null,
          preferred_time: text(meta.preferred_time) || null,
          created_at: "",
          updated_at: "",
        };
      }
      return mapRow(data as Record<string, unknown>, meta);
    },
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
            qc.setQueryData(
              ["profile", user.id],
              mapRow(payload.new as Record<string, unknown>, meta)
            );
          } else {
            void qc.invalidateQueries({ queryKey: ["profile", user.id] });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const save = useMutation({
    mutationFn: async (input: ProfileInput): Promise<Profile> => {
      if (!user) throw new Error("Not signed in");

      const full_name = input.full_name.trim() || null;
      const phone = input.phone.trim() || null;
      const address = input.address.trim() || null;
      const telegram = normalizeTelegram(input.telegram) || null;
      const preferred_time = (input.preferred_time ?? "").trim() || null;
      const avatar_url =
        input.avatar_url !== undefined
          ? input.avatar_url?.trim() || null
          : query.data?.avatar_url ?? null;
      const cover_url =
        input.cover_url !== undefined
          ? input.cover_url?.trim() || null
          : query.data?.cover_url ?? null;

      const row = await persistProfile(
        user.id,
        {
          full_name,
          phone,
          address,
          avatar_url,
          cover_url,
          telegram,
          preferred_time,
        },
        {
          avatar_url: query.data?.avatar_url ?? null,
          cover_url: query.data?.cover_url ?? null,
        }
      );

      await syncAuthMeta({
        full_name,
        phone,
        avatar_url,
        cover_url,
        telegram,
        preferred_time,
      });

      // Return exactly what the user saved (name + phone never lost)
      return {
        id: String(row.id ?? query.data?.id ?? ""),
        user_id: user.id,
        full_name,
        phone,
        address,
        avatar_url,
        cover_url,
        telegram,
        preferred_time,
        created_at: String(row.created_at ?? query.data?.created_at ?? ""),
        updated_at: String(row.updated_at ?? new Date().toISOString()),
      };
    },
    onSuccess: (data) => {
      qc.setQueryData(["profile", user?.id], data);
    },
  });

  const uploadAvatarFile = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not signed in");
      await ensureUserProfile(user);
      return uploadProfileAvatar(user.id, file);
    },
  });

  const uploadCoverFile = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not signed in");
      await ensureUserProfile(user);
      return uploadProfileCover(user.id, file);
    },
  });

  return { ...query, save, uploadAvatarFile, uploadCoverFile };
};
