import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  sort_order: number;
}

// Shown if the team_members table can't be read (e.g. before it's created).
// These ids are prefixed "default-" so the UI knows they aren't real rows and
// hides the edit/delete controls for them.
export const DEFAULT_TEAM: TeamMember[] = [
  { id: "default-1", name: "សុវណ្ណ ចេន", role: "ស្ថាបនិក និង CEO", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face", sort_order: 1 },
  { id: "default-2", name: "តារា គឹម", role: "អ្នកគ្រប់គ្រងផ្នែកលក់", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", sort_order: 2 },
  { id: "default-3", name: "ស្រីមុំ ផាន់", role: "អ្នកឯកទេសហិរញ្ញវត្ថុ", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face", sort_order: 3 },
  { id: "default-4", name: "វីរៈ ហេង", role: "អ្នកគ្រប់គ្រងសេវាកម្ម", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", sort_order: 4 },
];

export const isRealTeamMember = (id: string) => !id.startsWith("default-");

// team_members isn't in the generated Supabase types, so use an untyped handle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

export type TeamMemberInput = Omit<TeamMember, "id">;

export const useTeam = () => {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await db
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("team_members query failed, using defaults:", error.message);
        return DEFAULT_TEAM;
      }
      if (!data || data.length === 0) return DEFAULT_TEAM;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((row: any) => ({
        id: row.id,
        name: row.name ?? "",
        role: row.role ?? "",
        image: row.image ?? "",
        sort_order: row.sort_order ?? 0,
      }));
    },
  });
};

const errMessage = (error: unknown) =>
  error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : "error";

export const useCreateTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (member: TeamMemberInput) => {
      const { error } = await db.from("team_members").insert(member);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team member added");
    },
    onError: (error: unknown) => toast.error("Failed to add: " + errMessage(error)),
  });
};

export const useUpdateTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...member }: TeamMember) => {
      const { error } = await db
        .from("team_members")
        .update({ ...member, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team member saved");
    },
    onError: (error: unknown) => toast.error("Failed to save: " + errMessage(error)),
  });
};

export const useDeleteTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team member removed");
    },
    onError: (error: unknown) => toast.error("Failed to remove: " + errMessage(error)),
  });
};
