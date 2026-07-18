import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAdmin = () => {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["admin-status", user?.id],
    queryFn: async () => {
      // is_admin() is SECURITY DEFINER, so it reads admin_users without
      // tripping that table's own RLS.
      const { data, error } = await supabase.rpc("is_admin", {
        _user_id: user!.id,
      });
      if (error) throw error;
      return data === true;
    },
    enabled: !!user?.id,
  });

  // Signed-out users are never admins, and a failed check must not grant access.
  return { isAdmin: isAdmin ?? false, isLoading };
};
