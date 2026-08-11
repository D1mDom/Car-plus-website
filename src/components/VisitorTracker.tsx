import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { recordSiteVisit } from "@/hooks/useVisitors";

/** Counts one visit per browser session on public pages. */
const VisitorTracker = () => {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    void recordSiteVisit().then((recorded) => {
      if (recorded) {
        void queryClient.invalidateQueries({ queryKey: ["visitor-count"] });
      }
    });
  }, [pathname, queryClient]);

  return null;
};

export default VisitorTracker;
