import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAdmin = () => {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["admin-status", user?.id],
    queryFn: async () => {
      // Bypassed for local testing: always return true
      return true;
    },
    enabled: !!user?.id,
  });

  return { isAdmin: true, isLoading: false };
};
