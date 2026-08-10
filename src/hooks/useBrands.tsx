import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BRAND_ROLE_ACTIVE,
  BRAND_ROLE_HIDDEN,
} from "@/lib/brandStorage";

export interface Brand {
  id: string;
  name: string;
  logo: string;
  sort_order: number;
  is_active: boolean;
}

export type BrandInput = Omit<Brand, "id">;

// Prefer public.brands when it exists. Until that migration is run, store brands
// in team_members with a reserved role marker so Admin → Brands works today.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

type StorageMode = "table" | "fallback";

const isMissingBrandsTable = (error: unknown) => {
  const msg =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "");
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return (
    code === "PGRST205" ||
    msg.includes("Could not find the table") ||
    msg.includes("'public.brands'") ||
    msg.includes('relation "public.brands" does not exist')
  );
};

const mapTableRow = (row: Record<string, unknown>): Brand => ({
  id: String(row.id ?? ""),
  name: String(row.name ?? ""),
  logo: String(row.logo ?? ""),
  sort_order: Number(row.sort_order ?? 0),
  is_active: row.is_active !== false,
});

const mapFallbackRow = (row: Record<string, unknown>): Brand => ({
  id: String(row.id ?? ""),
  name: String(row.name ?? ""),
  logo: String(row.image ?? ""),
  sort_order: Number(row.sort_order ?? 0),
  is_active: String(row.role ?? "") !== BRAND_ROLE_HIDDEN,
});

const errMessage = (error: unknown) =>
  error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : "error";

let cachedMode: StorageMode | null = null;

const detectMode = async (): Promise<StorageMode> => {
  if (cachedMode) return cachedMode;
  const { error } = await db.from("brands").select("id").limit(1);
  if (!error) {
    cachedMode = "table";
    return "table";
  }
  if (isMissingBrandsTable(error)) {
    cachedMode = "fallback";
    return "fallback";
  }
  // Unexpected error — try table path; mutations will surface the real message.
  cachedMode = "table";
  return "table";
};

const loadBrands = async (activeOnly: boolean): Promise<Brand[]> => {
  const mode = await detectMode();

  if (mode === "table") {
    let query = db
      .from("brands")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (activeOnly) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) {
      if (isMissingBrandsTable(error)) {
        cachedMode = "fallback";
        return loadBrands(activeOnly);
      }
      console.warn("brands query failed:", error.message);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => mapTableRow(row));
  }

  const { data, error } = await db
    .from("team_members")
    .select("*")
    .in("role", [BRAND_ROLE_ACTIVE, BRAND_ROLE_HIDDEN])
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("brand fallback query failed:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let brands = (data ?? []).map((row: any) => mapFallbackRow(row));
  if (activeOnly) brands = brands.filter((b) => b.is_active);
  return brands;
};

const invalidateBrandQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["brands"] });
  queryClient.invalidateQueries({ queryKey: ["team-members"] });
};

export const useBrands = (options?: { activeOnly?: boolean }) => {
  const activeOnly = options?.activeOnly !== false;

  return useQuery({
    queryKey: ["brands", activeOnly ? "active" : "all"],
    queryFn: () => loadBrands(activeOnly),
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (brand: BrandInput) => {
      const mode = await detectMode();
      if (mode === "table") {
        const { error } = await db.from("brands").insert(brand);
        if (error) {
          if (isMissingBrandsTable(error)) {
            cachedMode = "fallback";
            return createBrandFallback(brand);
          }
          throw error;
        }
        return;
      }
      await createBrandFallback(brand);
    },
    onSuccess: () => {
      invalidateBrandQueries(queryClient);
      toast.success("Brand added");
    },
    onError: (error: unknown) => toast.error("Failed to add: " + errMessage(error)),
  });
};

async function createBrandFallback(brand: BrandInput) {
  const { error } = await db.from("team_members").insert({
    name: brand.name,
    role: brand.is_active ? BRAND_ROLE_ACTIVE : BRAND_ROLE_HIDDEN,
    image: brand.logo,
    sort_order: brand.sort_order,
  });
  if (error) throw error;
}

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...brand }: Brand & { id: string }) => {
      const mode = await detectMode();
      if (mode === "table") {
        const { error } = await db
          .from("brands")
          .update({ ...brand, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) {
          if (isMissingBrandsTable(error)) {
            cachedMode = "fallback";
          } else {
            throw error;
          }
        } else {
          return;
        }
      }
      const { error } = await db
        .from("team_members")
        .update({
          name: brand.name,
          image: brand.logo,
          sort_order: brand.sort_order,
          role: brand.is_active ? BRAND_ROLE_ACTIVE : BRAND_ROLE_HIDDEN,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateBrandQueries(queryClient);
      toast.success("Brand updated");
    },
    onError: (error: unknown) => toast.error("Failed to update: " + errMessage(error)),
  });
};

export const useUpdateBrandOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: { id: string; sort_order: number }[]) => {
      const mode = await detectMode();
      const table = mode === "table" ? "brands" : "team_members";
      for (const row of rows) {
        const { error } = await db
          .from(table)
          .update({ sort_order: row.sort_order, updated_at: new Date().toISOString() })
          .eq("id", row.id);
        if (error) {
          if (mode === "table" && isMissingBrandsTable(error)) {
            cachedMode = "fallback";
            const { error: fbError } = await db
              .from("team_members")
              .update({ sort_order: row.sort_order, updated_at: new Date().toISOString() })
              .eq("id", row.id);
            if (fbError) throw fbError;
            continue;
          }
          throw error;
        }
      }
    },
    onSuccess: () => invalidateBrandQueries(queryClient),
    onError: (error: unknown) => toast.error("Failed to reorder: " + errMessage(error)),
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const mode = await detectMode();
      if (mode === "table") {
        const { error } = await db.from("brands").delete().eq("id", id);
        if (error) {
          if (isMissingBrandsTable(error)) {
            cachedMode = "fallback";
          } else {
            throw error;
          }
        } else {
          return;
        }
      }
      const { error } = await db.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateBrandQueries(queryClient);
      toast.success("Brand removed");
    },
    onError: (error: unknown) => toast.error("Failed to remove: " + errMessage(error)),
  });
};
