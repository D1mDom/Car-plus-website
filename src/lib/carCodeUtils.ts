import type { Car } from "@/hooks/useCars";

const CODE_PATTERN = /(?:CP|DOM)[-_]?(\d{4})[-_]?(\d+)/i;

/** Parse numeric suffix from codes like CP2026-001 or DOM-015. */
const parseCodeNumber = (code: string): number => {
  const m = code.match(CODE_PATTERN);
  if (m) return parseInt(m[2], 10);
  const trailing = code.match(/(\d+)\s*$/);
  return trailing ? parseInt(trailing[1], 10) : 0;
};

/** Generate the next unit number, e.g. CP2026-016. */
export const generateNextCarCode = (cars: Car[], year = new Date().getFullYear()): string => {
  const prefix = `CP${year}-`;
  let max = 0;
  for (const car of cars) {
    if (car.code) max = Math.max(max, parseCodeNumber(car.code));
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
};
