import type { QueryClient } from "@tanstack/react-query";

/** Clear React Query cache and browser Cache API entries, then reload the page. */
export async function clearAppCache(queryClient: QueryClient): Promise<void> {
  queryClient.clear();
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  window.location.reload();
}
