import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInput = {
  full_name: string;
  phone: string;
  address: string;
};

export const useProfile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (input: ProfileInput) => {
      if (!user) throw new Error("Not signed in");
      const payload = {
        user_id: user.id,
        full_name: input.full_name.trim() || null,
        phone: input.phone.trim() || null,
        address: input.address.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (query.data?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", query.data.id)
          .select()
          .single();
        if (error) throw error;
        return data as Profile;
      }

      const { data, error } = await supabase
        .from("profiles")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      qc.setQueryData(["profile", user?.id], data);
      void supabase.auth.updateUser({
        data: { full_name: data.full_name ?? "" },
      });
    },
  });

  return { ...query, save };
};
