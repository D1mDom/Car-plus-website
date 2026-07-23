import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContactInfo {
  phone: string;
  telegram: string;
  facebook: string;
  address: string;
  email: string;
  map_link: string;
}

// Shown if the contact_info row can't be read (e.g. before the table is created).
export const DEFAULT_CONTACT: ContactInfo = {
  phone: "+855 12 345 678",
  telegram: "@Carplus777",
  facebook: "https://facebook.com/CarPlus",
  address: "ភ្នំពេញ, កម្ពុជា",
  email: "",
  map_link: "",
};

// contact_info isn't in the generated Supabase types, so use an untyped handle
// for this one table.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

export const useContact = () => {
  return useQuery({
    queryKey: ["contact-info"],
    queryFn: async (): Promise<ContactInfo> => {
      const { data, error } = await db
        .from("contact_info")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.warn("contact_info query failed, using defaults:", error.message);
        return DEFAULT_CONTACT;
      }
      if (!data) return DEFAULT_CONTACT;

      return {
        phone: data.phone ?? "",
        telegram: data.telegram ?? "",
        facebook: data.facebook ?? "",
        address: data.address ?? "",
        email: data.email ?? "",
        map_link: data.map_link ?? "",
      };
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contact: ContactInfo) => {
      const { error } = await db
        .from("contact_info")
        .update({ ...contact, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-info"] });
      toast.success("Contact info saved");
    },
    onError: (error: unknown) => {
      // Supabase errors are plain objects with a `message`, not Error instances.
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : "error";
      toast.error("Failed to save: " + message);
    },
  });
};
