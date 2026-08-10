import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadProfileAvatar } from "@/lib/imageUpload";

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
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

const isMissingColumn = (e: unknown) => {
  const m = errMessage(e).toLowerCase();
  return (
    (m.includes("avatar_url") || m.includes("telegram") || m.includes("preferred_time")) &&
    (m.includes("column") || m.includes("schema cache") || m.includes("could not find"))
  );
};

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
  telegram: string | null;
  preferred_time: string | null;
}) => {
  try {
    await supabase.auth.updateUser({
      data: {
        full_name: input.full_name ?? "",
        phone: input.phone ?? "",
        avatar_url: input.avatar_url ?? "",
        telegram: input.telegram ?? "",
        preferred_time: input.preferred_time ?? "",
      },
    });
  } catch (e) {
    console.warn("profile auth meta sync failed:", e);
  }
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
    telegram: string | null;
    preferred_time: string | null;
  }
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

  const fullPayload = {
    full_name: fields.full_name,
    phone: fields.phone,
    address: fields.address,
    avatar_url: fields.avatar_url,
    telegram: fields.telegram,
    preferred_time: fields.preferred_time,
    updated_at,
  };

  try {
    return await tryWrite(fullPayload);
  } catch (e) {
    if (!isMissingColumn(e)) throw e;
    // Older schema: only core columns
    const basic = await tryWrite({
      full_name: fields.full_name,
      phone: fields.phone,
      address: fields.address,
      updated_at,
    });
    return {
      ...basic,
      avatar_url: fields.avatar_url,
      telegram: fields.telegram,
      preferred_time: fields.preferred_time,
    };
  }
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

      const row = await persistProfile(user.id, {
        full_name,
        phone,
        address,
        avatar_url,
        telegram,
        preferred_time,
      });

      await syncAuthMeta({
        full_name,
        phone,
        avatar_url,
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
      return uploadProfileAvatar(user.id, file);
    },
  });

  return { ...query, save, uploadAvatarFile };
};
