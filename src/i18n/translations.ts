import { km } from "./km";
import { en } from "./en";

export type Lang = "km" | "en";

export { km, en };

export const translations = {
  km,
  en,
} as const;

export type TranslationKey = keyof typeof km;
