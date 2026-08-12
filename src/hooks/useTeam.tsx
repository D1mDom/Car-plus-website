import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isBrandRole } from "@/lib/brandStorage";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  phone: string;
  telegram: string;
  sort_order: number;
}

export type TeamMemberInput = Omit<TeamMember, "id">;

/** Packed into `image` so phone/telegram survive without DB columns. */
const CONTACT_MARKER = "|||CPCONTACT|||";

/** Secondary store in Storage — works even if image packing is stripped. */
const CONTACTS_BUCKET = "car-images";
const CONTACTS_PATH = "meta/team-contacts.json";

type ContactMeta = { phone: string; telegram: string };
type ContactMap = Record<string, ContactMeta>;

export const stripContactFromImage = (raw: string): string => {
  const i = raw.indexOf(CONTACT_MARKER);
  return i === -1 ? raw : raw.slice(0, i);
};

const unpackContact = (rawImage: string): { image: string; phone: string; telegram: string } => {
  const i = rawImage.indexOf(CONTACT_MARKER);
  if (i === -1) return { image: rawImage, phone: "", telegram: "" };
  try {
    const meta = JSON.parse(rawImage.slice(i + CONTACT_MARKER.length)) as Partial<ContactMeta>;
    return {
      image: rawImage.slice(0, i),
      phone: meta.phone ?? "",
      telegram: meta.telegram ?? "",
    };
  } catch {
    return { image: rawImage, phone: "", telegram: "" };
  }
};

const packContactIntoImage = (image: string, phone: string, telegram: string) => {
  const clean = stripContactFromImage(image);
  if (!phone.trim() && !telegram.trim()) return clean;
  return `${clean}${CONTACT_MARKER}${JSON.stringify({
    phone: phone.trim(),
    telegram: telegram.trim(),
  })}`;
};

const normalizeTelegram = (value: string) => {
  const v = value.trim();
  if (!v) return "";
  const handle = v.replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  return handle ? `@${handle}` : "";
};

// Shown if the team_members table can't be read / is empty of real members.
export const DEFAULT_TEAM: TeamMember[] = [
  {
    id: "default-1",
    name: "សុវណ្ណ ចេន",
    role: "ស្ថាបនិក និង CEO",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
    phone: "",
    telegram: "",
    sort_order: 1,
  },
  {
    id: "default-2",
    name: "តារា គឹម",
    role: "អ្នកគ្រប់គ្រងផ្នែកលក់",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    phone: "",
    telegram: "",
    sort_order: 2,
  },
  {
    id: "default-3",
    name: "ស្រីមុំ ផាន់",
    role: "អ្នកឯកទេសហិរញ្ញវត្ថុ",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
    phone: "",
    telegram: "",
    sort_order: 3,
  },
  {
    id: "default-4",
    name: "វីរៈ ហេង",
    role: "អ្នកគ្រប់គ្រងសេវាកម្ម",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    phone: "",
    telegram: "",
    sort_order: 4,
  },
];

export const isRealTeamMember = (id: string) => !id.startsWith("default-");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

const errMessage = (error: unknown) =>
  error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : "error";

async function loadContactMap(): Promise<ContactMap> {
  try {
    const { data, error } = await supabase.storage.from(CONTACTS_BUCKET).download(CONTACTS_PATH);
    if (error || !data) return {};
    const parsed = JSON.parse(await data.text()) as ContactMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function saveContactMap(map: ContactMap): Promise<void> {
  const blob = new Blob([JSON.stringify(map)], { type: "application/json" });
  const { error } = await supabase.storage.from(CONTACTS_BUCKET).upload(CONTACTS_PATH, blob, {
    upsert: true,
    contentType: "application/json",
    cacheControl: "0",
  });
  if (error) {
    // Storage may be blocked for some roles — packing into image still keeps data.
    console.warn("team contacts storage save failed:", error.message);
  }
}

async function upsertContact(id: string, phone: string, telegram: string) {
  const map = await loadContactMap();
  if (!phone && !telegram) {
    delete map[id];
  } else {
    map[id] = { phone, telegram };
  }
  await saveContactMap(map);
}

async function removeContact(id: string) {
  const map = await loadContactMap();
  if (!(id in map)) return;
  delete map[id];
  await saveContactMap(map);
}

const mapRow = (row: Record<string, unknown>, overlay: ContactMap): TeamMember => {
  const packed = unpackContact(String(row.image ?? ""));
  const id = String(row.id ?? "");
  const fromStore = overlay[id];
  const phoneCol = typeof row.phone === "string" ? row.phone : "";
  const telegramCol = typeof row.telegram === "string" ? row.telegram : "";

  return {
    id,
    name: String(row.name ?? ""),
    role: String(row.role ?? ""),
    image: packed.image,
    phone: phoneCol || fromStore?.phone || packed.phone || "",
    telegram: telegramCol || fromStore?.telegram || packed.telegram || "",
    sort_order: Number(row.sort_order ?? 0),
  };
};

/**
 * Always pack phone/telegram into `image` (works with current schema).
 * Also write Storage overlay + best-effort DB columns.
 */
const persistMember = async (
  mode: "insert" | "update",
  member: TeamMemberInput,
  id?: string
): Promise<string> => {
  const phone = member.phone.trim();
  const telegram = normalizeTelegram(member.telegram);
  const cleanImage = stripContactFromImage(member.image);
  // CRITICAL: always pack — do not rely on DB columns existing.
  const image = packContactIntoImage(cleanImage, phone, telegram);

  const baseRow = {
    name: member.name.trim(),
    role: member.role.trim(),
    image,
    sort_order: member.sort_order,
  };

  if (mode === "insert") {
    const { data, error } = await db.from("team_members").insert(baseRow).select("id").single();
    if (error) throw error;
    const newId = String(data.id);
    await upsertContact(newId, phone, telegram);
    // Best-effort columns (ignore if missing).
    await db.from("team_members").update({ phone, telegram }).eq("id", newId);
    return newId;
  }

  if (!id) throw new Error("Missing member id");

  const { error } = await db
    .from("team_members")
    .update({ ...baseRow, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await upsertContact(id, phone, telegram);
  await db.from("team_members").update({ phone, telegram }).eq("id", id);
  return id;
};

export const useTeam = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["team-members"],
    queryFn: async (): Promise<TeamMember[]> => {
      const [{ data, error }, overlay] = await Promise.all([
        db
          .from("team_members")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        loadContactMap(),
      ]);

      if (error) {
        console.warn("team_members query failed, using defaults:", error.message);
        return DEFAULT_TEAM;
      }
      if (!data || data.length === 0) return DEFAULT_TEAM;

      const members = (data as Record<string, unknown>[])
        .filter((row) => !isBrandRole(String(row.role ?? "")))
        .map((row) => mapRow(row, overlay));

      return members.length > 0 ? members : DEFAULT_TEAM;
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Live updates when another tab/admin changes team_members
  useEffect(() => {
    const channel = supabase
      .channel("team-members-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["team-members"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useCreateTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (member: TeamMemberInput) => persistMember("insert", member),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team-members"] });
      await queryClient.refetchQueries({ queryKey: ["team-members"] });
      toast.success("Team member added — phone & Telegram saved");
    },
    onError: (error: unknown) => toast.error("Failed to add: " + errMessage(error)),
  });
};

export const useUpdateTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...member }: TeamMember) => persistMember("update", member, id),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ["team-members"] });
      const previous = queryClient.getQueryData<TeamMember[]>(["team-members"]);
      queryClient.setQueryData<TeamMember[]>(["team-members"], (old = []) =>
        old.map((m) =>
          m.id === updated.id
            ? {
                ...m,
                ...updated,
                image: stripContactFromImage(updated.image),
                phone: updated.phone.trim(),
                telegram: normalizeTelegram(updated.telegram),
              }
            : m
        )
      );
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["team-members"], ctx.previous);
      toast.error("Failed to save: " + errMessage(error));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team-members"] });
      await queryClient.refetchQueries({ queryKey: ["team-members"] });
      toast.success("Saved — phone & Telegram will show on About page");
    },
  });
};

export const useUpdateTeamOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await db
          .from("team_members")
          .update({ sort_order: u.sort_order, updated_at: new Date().toISOString() })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team order updated");
    },
    onError: (error: unknown) => toast.error("Failed to reorder: " + errMessage(error)),
  });
};

export const useDeleteTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("team_members").delete().eq("id", id);
      if (error) throw error;
      await removeContact(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team-members"] });
      await queryClient.refetchQueries({ queryKey: ["team-members"] });
      toast.success("Team member removed");
    },
    onError: (error: unknown) => toast.error("Failed to remove: " + errMessage(error)),
  });
};
