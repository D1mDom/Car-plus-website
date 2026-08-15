import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Car } from "@/hooks/useCars";
import { sanitizeOrderContact } from "@/lib/orderSecurity";
import { refreshSoldCars } from "@/hooks/useSoldCarIds";

// Customer place-order. Supports BOTH schemas:
// - New: orders.customer_name + order_items.car_name
// - Old (live types.ts): orders without customer_name, items without car_name
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any; rpc: (fn: string) => any };

export type PlaceOrderInput = {
  car: Car;
  customerName: string;
  phone: string;
  telegram?: string;
  preferredTime?: string;
  note?: string;
};

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

const buildNotes = (input: {
  carName: string;
  telegram?: string;
  preferredTime?: string;
  note?: string;
}) => {
  const parts = [`Car: ${input.carName.slice(0, 200)}`];
  if (input.telegram?.trim()) {
    const tg = input.telegram.trim().startsWith("@")
      ? input.telegram.trim()
      : `@${input.telegram.trim().replace(/^@/, "")}`;
    parts.push(`Telegram: ${tg}`);
  }
  if (input.preferredTime?.trim()) parts.push(`Preferred time: ${input.preferredTime.trim()}`);
  if (input.note?.trim()) parts.push(`Note: ${input.note.trim()}`);
  return parts.join("\n");
};

/** Load live car price/name from DB — never trust client-side car.price. */
async function fetchOrderableCar(carId: string) {
  const { data, error } = await supabase
    .from("cars")
    .select("id, name, price, is_active")
    .eq("id", carId)
    .maybeSingle();

  if (error) throw new Error(errMessage(error));
  if (!data || data.is_active === false) throw new Error("Car is not available");
  const price = Number(data.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid car price");
  return { id: String(data.id), name: data.name, price };
}

/** Insert order + item; falls back to old DB columns if needed. */
export async function saveCustomerOrder(input: {
  userId: string;
  customerName: string;
  phone: string;
  telegram?: string;
  preferredTime?: string;
  note?: string;
  car: Car;
}) {
  const { userId, car, telegram, preferredTime, note } = input;
  const carId = String(car.id);

  if (carId.startsWith("mock-")) {
    throw new Error("This demo car cannot be ordered. Please choose a real listing.");
  }

  const contact = sanitizeOrderContact(input);
  if (!contact) throw new Error("Invalid contact details");

  const liveCar = await fetchOrderableCar(carId);
  const notes = buildNotes({
    carName: liveCar.name,
    telegram: contact.telegram,
    preferredTime: contact.preferredTime,
    note: contact.note,
  });

  let order: { id: string } | null = null;
  {
    const first = await db
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: contact.customerName,
        phone: contact.phone,
        status: "pending",
        total_amount: liveCar.price,
        notes,
      })
      .select("id")
      .single();

    if (first.error && isMissingColumn(first.error, "customer_name")) {
      const legacy = await db
        .from("orders")
        .insert({
          user_id: userId,
          phone: contact.phone,
          status: "pending",
          total_amount: liveCar.price,
          notes: `${contact.customerName}\n${notes}`,
        })
        .select("id")
        .single();
      if (legacy.error) throw new Error(errMessage(legacy.error));
      order = legacy.data;
    } else if (first.error) {
      throw new Error(errMessage(first.error));
    } else {
      order = first.data;
    }
  }

  if (!order?.id) throw new Error("Order was not created");

  const itemNew = await db.from("order_items").insert({
    order_id: order.id,
    car_id: carId,
    car_name: liveCar.name,
    price: liveCar.price,
  });

  if (itemNew.error && isMissingColumn(itemNew.error, "car_name")) {
    const itemLegacy = await db.from("order_items").insert({
      order_id: order.id,
      car_id: carId,
      price: liveCar.price,
    });
    if (itemLegacy.error) {
      await db.from("orders").delete().eq("id", order.id);
      throw new Error(errMessage(itemLegacy.error));
    }
  } else if (itemNew.error) {
    await db.from("orders").delete().eq("id", order.id);
    throw new Error(errMessage(itemNew.error));
  }

  return order.id;
}

export const usePlaceOrder = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: PlaceOrderInput) => {
      if (!user) throw new Error("login-required");
      if (String(input.car.id).startsWith("mock-")) {
        throw new Error("This demo car cannot be ordered. Please choose a real listing.");
      }

      const sold = await db.rpc("get_sold_car_ids");
      if (!sold.error) {
        const ids = Array.isArray(sold.data)
          ? sold.data.map((row: unknown) => (typeof row === "string" ? row : String((row as { car_id?: unknown })?.car_id ?? "")))
          : [];
        if (ids.includes(String(input.car.id))) throw new Error("sold-out");
      }

      const contact = sanitizeOrderContact({
        customerName: input.customerName.trim()
          || (user.user_metadata?.full_name as string)
          || user.email
          || "Customer",
        phone: input.phone,
        telegram: input.telegram,
        preferredTime: input.preferredTime,
        note: input.note,
      });
      if (!contact) throw new Error("Invalid contact details");

      await saveCustomerOrder({
        userId: user.id,
        customerName: contact.customerName,
        phone: contact.phone,
        telegram: contact.telegram,
        preferredTime: contact.preferredTime,
        note: contact.note,
        car: input.car,
      });
    },
    onSuccess: async (_data, input) => {
      await qc.invalidateQueries({ queryKey: ["admin-orders"] });
      await qc.invalidateQueries({ queryKey: ["my-orders"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      qc.setQueryData<string[]>(["sold-car-ids"], (old) =>
        Array.from(new Set([...(old ?? []), String(input.car.id)])),
      );
      refreshSoldCars(qc);
      await qc.refetchQueries({ queryKey: ["my-orders"] });
      toast.success("Order placed! Staff will contact you by phone or Telegram.");
    },
    onError: (e: unknown) => {
      const m = errMessage(e);
      if (m === "login-required") toast.error("Please sign in to place an order");
      else if (m === "Invalid contact details") toast.error("Please check your name and phone number");
      else if (m === "sold-out" || m.toLowerCase().includes("already sold")) {
        toast.error("This car is sold out. Please choose another car.");
      }
      else toast.error("Failed to place order: " + m);
    },
  });
};
