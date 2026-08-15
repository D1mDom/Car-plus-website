export const DELIVERY_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "delivered",
  "completed",
] as const;

export type DeliveryStep = (typeof DELIVERY_STEPS)[number];

export const NEXT_DELIVERY_STATUS: Record<string, DeliveryStep | null> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "delivered",
  delivered: "completed",
  completed: null,
  cancelled: null,
};

export const CUSTOMER_NOTIFY_STATUSES = new Set([
  "confirmed",
  "processing",
  "delivered",
  "completed",
  "cancelled",
]);

export const deliveryStepIndex = (status: string) => {
  const idx = DELIVERY_STEPS.indexOf(status as DeliveryStep);
  return idx < 0 ? 0 : idx;
};
