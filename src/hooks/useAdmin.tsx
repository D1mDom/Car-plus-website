import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { hasDashboardAccess } from "@/lib/dashboardAccess";

export const useAdmin = () => {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["admin-status", user?.id, user?.email],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin", {
        _user_id: user!.id,
      });
      const rpcOk = !error && data === true;
      return hasDashboardAccess(user!, rpcOk);
    },
    enabled: !!user?.id,
  });

  return { isAdmin: isAdmin ?? false, isLoading };
};
