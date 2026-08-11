import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const VISIT_SESSION_KEY = "carplus-visit-recorded";

export const recordSiteVisit = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(VISIT_SESSION_KEY)) return false;
  sessionStorage.setItem(VISIT_SESSION_KEY, "1");

  try {
    const { error } = await supabase.rpc("record_site_visit");
    if (error) {
      console.warn("record_site_visit:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("record_site_visit failed", e);
    return false;
  }
};

export const useVisitorCount = (refetchMs = 30_000) => {
  return useQuery({
    queryKey: ["visitor-count"],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("get_visitor_count");
      if (error) {
        console.warn("get_visitor_count:", error.message);
        return 0;
      }
      return typeof data === "number" ? data : Number(data) || 0;
    },
    refetchInterval: refetchMs,
    staleTime: Math.min(refetchMs / 2, 15_000),
  });
};
