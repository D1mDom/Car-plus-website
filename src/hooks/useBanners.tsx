import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Banner {
  id: string;
  image: string;
  sort_order: number;
}

// banners isn't in the generated Supabase types, so use an untyped handle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

export const useBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async (): Promise<Banner[]> => {
      const { data, error } = await db
        .from("banners")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("banners query failed, using default slides:", error.message);
        return [];
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => ({
        id: row.id,
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

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ image, sort_order }: { image: string; sort_order: number }) => {
      const { error } = await db.from("banners").insert({ image, sort_order });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner added");
    },
    onError: (error: unknown) => toast.error("Failed to add: " + errMessage(error)),
  });
};

export const useUpdateBannerOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: { id: string; sort_order: number }[]) => {
      for (const row of rows) {
        const { error } = await db
          .from("banners")
          .update({ sort_order: row.sort_order, updated_at: new Date().toISOString() })
          .eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] }),
    onError: (error: unknown) => toast.error("Failed to reorder: " + errMessage(error)),
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner removed");
    },
    onError: (error: unknown) => toast.error("Failed to remove: " + errMessage(error)),
  });
};
