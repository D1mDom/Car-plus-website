import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { safeUUID } from "@/lib/utils";

export type PaymentMethod = "cash" | "transfer" | "card" | "other";

export interface Receipt {
  id: string;
  receipt_no: string;
  order_id: string | null;
  customer_name: string;
  phone: string | null;
  /** Line item description (service / car) */
  description: string | null;
  car_name: string | null;
  car_code: string | null;
  year: string | null;
  make: string | null;
  model: string | null;
  unit_price: number;
  qty: number;
  tax_rate: number;
  /** Line total before tax (unit_price * qty). Kept as amount for list totals. */
  amount: number;
  payment_method: PaymentMethod;
  bank_name: string | null;
  account_no: string | null;
  notes: string | null;
  issued_at: string;
  created_at: string;
}

export interface NewReceiptInput {
  customer_name: string;
  phone?: string;
  description?: string;
  car_name?: string;
  car_code?: string;
  year?: string;
  make?: string;
  model?: string;
  unit_price: number;
  qty?: number;
  tax_rate?: number;
  payment_method?: PaymentMethod;
  bank_name?: string;
  account_no?: string;
  notes?: string;
  order_id?: string | null;
  issued_at?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };
const LOCAL_KEY = "carplus-receipts-v2";

const msg = (e: unknown) =>
  e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "error";

const isMissingTable = (e: unknown) => {
  const m = msg(e).toLowerCase();
  return m.includes("could not find the table") || m.includes("schema cache") || m.includes("does not exist");
};

const readLocal = (): Receipt[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY) || localStorage.getItem("carplus-receipts-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Receipt[];
    return Array.isArray(parsed) ? parsed.map((r) => normalize(r as unknown as Record<string, unknown>)) : [];
  } catch {
    return [];
  }
};

const writeLocal = (rows: Receipt[]) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
};

export const makeReceiptNo = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const tail = safeUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `INV-${y}${m}${day}-${tail}`;
};

export const receiptSubtotal = (r: Pick<Receipt, "unit_price" | "qty" | "amount">) => {
  const qty = Number(r.qty) || 1;
  const price = Number(r.unit_price);
  if (price > 0) return price * qty;
  return Number(r.amount) || 0;
};

export const receiptTax = (r: Pick<Receipt, "unit_price" | "qty" | "amount" | "tax_rate">) => {
  const rate = Number(r.tax_rate) || 0;
  return (receiptSubtotal(r) * rate) / 100;
};

export const receiptGrandTotal = (r: Pick<Receipt, "unit_price" | "qty" | "amount" | "tax_rate">) =>
  receiptSubtotal(r) + receiptTax(r);

const normalize = (row: Record<string, unknown>): Receipt => {
  const qty = Math.max(1, Number(row.qty ?? 1) || 1);
  const unit_price = Number(row.unit_price ?? row.amount ?? 0) || 0;
  const amount = Number(row.amount ?? unit_price * qty) || 0;
  return {
    id: String(row.id),
    receipt_no: String(row.receipt_no ?? ""),
    order_id: (row.order_id as string | null) ?? null,
    customer_name: String(row.customer_name ?? ""),
    phone: (row.phone as string | null) ?? null,
    description: (row.description as string | null) ?? (row.car_name as string | null) ?? null,
    car_name: (row.car_name as string | null) ?? null,
    car_code: (row.car_code as string | null) ?? null,
    year: row.year != null ? String(row.year) : null,
    make: (row.make as string | null) ?? null,
    model: (row.model as string | null) ?? null,
    unit_price: unit_price || amount,
    qty,
    tax_rate: Number(row.tax_rate ?? 0) || 0,
    amount,
    payment_method: (row.payment_method as PaymentMethod) || "cash",
    bank_name: (row.bank_name as string | null) ?? null,
    account_no: (row.account_no as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    issued_at: String(row.issued_at ?? row.created_at ?? new Date().toISOString()),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
};

export const useReceipts = () => {
  return useQuery({
    queryKey: ["admin-receipts"],
    queryFn: async (): Promise<Receipt[]> => {
      const { data, error } = await db
        .from("receipts")
        .select("*")
        .order("issued_at", { ascending: false });

      if (error) {
        if (isMissingTable(error)) {
          return readLocal().sort(
            (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
          );
        }
        console.warn("receipts query failed:", error.message);
        return readLocal();
      }
      return (data ?? []).map((r: Record<string, unknown>) => normalize(r));
    },
    refetchOnMount: "always",
    staleTime: 0,
  });
};

export const useCreateReceipt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewReceiptInput): Promise<Receipt> => {
      const now = new Date().toISOString();
      const qty = Math.max(1, Number(input.qty) || 1);
      const unit_price = Number(input.unit_price) || 0;
      const tax_rate = Number(input.tax_rate) || 0;
      const amount = unit_price * qty;
      const description = (input.description || input.car_name || "").trim() || null;

      const payload = {
        receipt_no: makeReceiptNo(),
        order_id: input.order_id ?? null,
        customer_name: input.customer_name.trim() || "Customer",
        phone: input.phone?.trim() || null,
        description,
        car_name: input.car_name?.trim() || description,
        car_code: input.car_code?.trim() || null,
        year: input.year?.trim() || null,
        make: input.make?.trim() || null,
        model: input.model?.trim() || null,
        unit_price,
        qty,
        tax_rate,
        amount,
        payment_method: input.payment_method || "cash",
        bank_name: input.bank_name?.trim() || null,
        account_no: input.account_no?.trim() || null,
        notes: input.notes?.trim() || null,
        issued_at: input.issued_at || now,
      };

      const { data, error } = await db.from("receipts").insert(payload).select("*").single();

      if (error) {
        // Missing table OR missing new columns → fall back to local
        if (isMissingTable(error) || msg(error).toLowerCase().includes("column")) {
          const local: Receipt = {
            id: safeUUID(),
            ...payload,
            created_at: now,
          };
          const rows = [local, ...readLocal()];
          writeLocal(rows);
          return local;
        }
        throw error;
      }

      return normalize(data as Record<string, unknown>);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-receipts"] });
      toast.success("Receipt created");
    },
    onError: (e) => toast.error("Failed to create receipt: " + msg(e)),
  });
};

export const useUpdateReceipt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: NewReceiptInput & { id: string }): Promise<Receipt> => {
      const qty = Math.max(1, Number(input.qty) || 1);
      const unit_price = Number(input.unit_price) || 0;
      const tax_rate = Number(input.tax_rate) || 0;
      const amount = unit_price * qty;
      const description = (input.description || input.car_name || "").trim() || null;

      const payload = {
        customer_name: input.customer_name.trim() || "Customer",
        phone: input.phone?.trim() || null,
        description,
        car_name: input.car_name?.trim() || description,
        car_code: input.car_code?.trim() || null,
        year: input.year?.trim() || null,
        make: input.make?.trim() || null,
        model: input.model?.trim() || null,
        unit_price,
        qty,
        tax_rate,
        amount,
        payment_method: input.payment_method || "cash",
        bank_name: input.bank_name?.trim() || null,
        account_no: input.account_no?.trim() || null,
        notes: input.notes?.trim() || null,
        ...(input.issued_at ? { issued_at: input.issued_at } : {}),
      };

      const { data, error } = await db
        .from("receipts")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        if (isMissingTable(error) || msg(error).toLowerCase().includes("column")) {
          const rows = readLocal();
          const idx = rows.findIndex((r) => r.id === id);
          if (idx < 0) throw new Error("Receipt not found");
          const updated: Receipt = {
            ...rows[idx],
            ...payload,
            id,
            receipt_no: rows[idx].receipt_no,
            order_id: rows[idx].order_id,
            created_at: rows[idx].created_at,
            issued_at: input.issued_at || rows[idx].issued_at,
          };
          const next = [...rows];
          next[idx] = updated;
          writeLocal(next);
          return updated;
        }
        throw error;
      }

      return normalize(data as Record<string, unknown>);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-receipts"] });
      toast.success("Invoice updated");
    },
    onError: (e) => toast.error("Failed to update invoice: " + msg(e)),
  });
};

export const useDeleteReceipt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("receipts").delete().eq("id", id);
      if (error) {
        if (isMissingTable(error)) {
          writeLocal(readLocal().filter((r) => r.id !== id));
          return;
        }
        throw error;
      }
      // Also remove from local cache if present
      writeLocal(readLocal().filter((r) => r.id !== id));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-receipts"] });
      toast.success("Receipt deleted");
    },
    onError: (e) => toast.error("Failed to delete receipt: " + msg(e)),
  });
};
