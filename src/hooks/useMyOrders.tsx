import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface MyOrderItem {
  id: string;
  car_id: string | null;
  car_name: string | null;
  price: number;
}

export interface MyOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  phone?: string | null;
  customer_name?: string | null;
  notes?: string | null;
  order_items: MyOrderItem[];
}

export type MyOrderEditInput = {
  id: string;
  customerName: string;
  phone: string;
  telegram?: string;
  preferredTime?: string;
  note?: string;
  carName?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

const errMessage = (e: unknown) => {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === "object" && "message" in e && (e as { message: unknown }).message) {
    return String((e as { message: unknown }).message);
  }
  return "Unknown error";
};

const isMissingColumn = (e: unknown, column: string) => {
  const m = errMessage(e).toLowerCase();
  return m.includes(column.toLowerCase()) && (m.includes("column") || m.includes("schema cache"));
};

export const parseOrderNotes = (notes?: string | null) => {
  const lines = (notes ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const get = (prefix: string) => {
    const line = lines.find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()));
    return line ? line.slice(prefix.length).trim() : "";
  };
  return {
    carName: get("Car:"),
    telegram: get("Telegram:").replace(/^@/, ""),
    preferredTime: get("Preferred time:"),
    note: get("Note:"),
  };
};

const buildNotes = (input: {
  carName?: string;
  telegram?: string;
  preferredTime?: string;
  note?: string;
}) => {
  const parts: string[] = [];
  if (input.carName?.trim()) parts.push(`Car: ${input.carName.trim()}`);
  if (input.telegram?.trim()) {
    const tg = input.telegram.trim().startsWith("@")
      ? input.telegram.trim()
      : `@${input.telegram.trim().replace(/^@/, "")}`;
    parts.push(`Telegram: ${tg}`);
  }
  if (input.preferredTime?.trim()) parts.push(`Preferred time: ${input.preferredTime.trim()}`);
  if (input.note?.trim()) parts.push(`Note: ${input.note.trim()}`);
  return parts.join("\n") || null;
};

export const useMyOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MyOrder[]> => {
      const { data, error } = await db
        .from("orders")
        .select("id, status, total_amount, created_at, phone, customer_name, notes, order_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        // Older DBs may not have customer_name — retry without it
        if (isMissingColumn(error, "customer_name")) {
          const legacy = await db
            .from("orders")
            .select("id, status, total_amount, created_at, phone, notes, order_items(*)")
            .eq("user_id", user!.id)
            .order("created_at", { ascending: false });
          if (legacy.error) {
            console.warn("my orders query failed:", legacy.error.message);
            return [];
          }
          return legacy.data ?? [];
        }
        console.warn("my orders query failed:", error.message);
        return [];
      }
      return data ?? [];
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`my-orders-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["my-orders", user.id] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["my-orders", user.id] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  return query;
};

const refresh = (qc: ReturnType<typeof useQueryClient>, userId?: string) => {
  void qc.invalidateQueries({ queryKey: ["my-orders", userId] });
  void qc.invalidateQueries({ queryKey: ["admin-orders"] });
  void qc.invalidateQueries({ queryKey: ["reports"] });
};

/** Customer can update contact details on their own pending order. */
export const useUpdateMyOrder = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: MyOrderEditInput) => {
      if (!user) throw new Error("login-required");

      const notes = buildNotes({
        carName: input.carName,
        telegram: input.telegram,
        preferredTime: input.preferredTime,
        note: input.note,
      });

      const full = await db
        .from("orders")
        .update({
          customer_name: input.customerName.trim(),
          phone: input.phone.trim(),
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (full.error && isMissingColumn(full.error, "customer_name")) {
        const legacy = await db
          .from("orders")
          .update({
            phone: input.phone.trim(),
            notes: `${input.customerName.trim()}\n${notes ?? ""}`.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.id)
          .eq("user_id", user.id)
          .eq("status", "pending")
          .select("id")
          .maybeSingle();
        if (legacy.error) throw new Error(errMessage(legacy.error));
        if (!legacy.data) throw new Error("Only pending orders can be edited");
        return;
      }

      if (full.error) throw new Error(errMessage(full.error));
      if (!full.data) throw new Error("Only pending orders can be edited");
    },
    onSuccess: () => {
      refresh(qc, user?.id);
      toast.success("Order updated");
    },
    onError: (e: unknown) => {
      const m = errMessage(e);
      if (m === "login-required") toast.error("Please sign in");
      else toast.error("Failed to update: " + m);
    },
  });
};

/** Customer can delete their own pending order (real DB delete). */
export const useDeleteMyOrder = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("login-required");
      const { data, error } = await db
        .from("orders")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (error) throw new Error(errMessage(error));
      if (!data) throw new Error("Only pending orders can be deleted");
    },
    onSuccess: () => {
      refresh(qc, user?.id);
      toast.success("Order deleted");
    },
    onError: (e: unknown) => {
      const m = errMessage(e);
      if (m === "login-required") toast.error("Please sign in");
      else toast.error("Failed to delete: " + m);
    },
  });
};
