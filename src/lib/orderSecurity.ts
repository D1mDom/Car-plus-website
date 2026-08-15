import { cleanPhoneInput, isValidPhone } from "@/lib/phoneUtils";

const MAX_NAME = 120;
const MAX_NOTE = 500;
const MAX_TELEGRAM = 32;
const ALLOWED_TIMES = new Set(["morning", "afternoon", "evening", "anytime"]);

export type OrderContactInput = {
  customerName: string;
  phone: string;
  telegram?: string;
  preferredTime?: string;
  note?: string;
};

export type SanitizedOrderContact = {
  customerName: string;
  phone: string;
  telegram?: string;
  preferredTime?: string;
  note?: string;
};

export const sanitizeCustomerName = (raw: string): string =>
  raw.replace(/[^\p{L}\p{M}\s'.\-]/gu, "").trim().slice(0, MAX_NAME);

export const sanitizeTelegram = (raw: string): string =>
  raw.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, MAX_TELEGRAM);

export const sanitizeOrderNote = (raw: string): string =>
  raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F<>]/g, "").trim().slice(0, MAX_NOTE);

export const sanitizePreferredTime = (raw?: string): string | undefined => {
  const v = raw?.trim();
  if (!v) return undefined;
  return ALLOWED_TIMES.has(v) ? v : undefined;
};

/** Validate + normalize contact fields before place/update order. */
export const sanitizeOrderContact = (input: OrderContactInput): SanitizedOrderContact | null => {
  const customerName = sanitizeCustomerName(input.customerName);
  const phone = cleanPhoneInput(input.phone).trim();
  const telegramRaw = input.telegram?.trim();
  const telegram = telegramRaw ? sanitizeTelegram(telegramRaw) : undefined;
  const preferredTime = sanitizePreferredTime(input.preferredTime);
  const noteRaw = input.note?.trim();
  const note = noteRaw ? sanitizeOrderNote(noteRaw) : undefined;

  if (customerName.length < 2) return null;
  if (!isValidPhone(phone)) return null;
  if (telegramRaw && !telegram) return null;

  return {
    customerName,
    phone,
    telegram: telegram || undefined,
    preferredTime,
    note: note || undefined,
  };
};
