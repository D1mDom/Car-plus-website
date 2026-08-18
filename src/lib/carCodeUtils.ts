import type { Car } from "@/hooks/useCars";

const CODE_PATTERN = /(?:CP|DOM)[-_]?(\d{4})[-_]?(\d+)/i;
const CODE_PLATE_SEP = " | ";

export function unpackCarIdentity(car: {
  code?: string | null;
  plate_number?: string | null;
  plateNumber?: string | null;
  tax_status?: string | null;
  taxStatus?: string | null;
  status?: string | null;
}): { taxPaperCode: string; plateNumber: string } {
  const rawCode = (car.code ?? "").trim();
  const fromCol = (car.plate_number ?? car.plateNumber ?? "").trim();

  if (fromCol) {
    const tax = rawCode.includes(CODE_PLATE_SEP)
      ? rawCode.split(CODE_PLATE_SEP)[0]!.trim()
      : rawCode;
    return { taxPaperCode: tax === fromCol ? "" : tax, plateNumber: fromCol };
  }

  if (rawCode.includes(CODE_PLATE_SEP)) {
    const [tax, ...rest] = rawCode.split(CODE_PLATE_SEP);
    return { taxPaperCode: (tax ?? "").trim(), plateNumber: rest.join(CODE_PLATE_SEP).trim() };
  }

  const taxLabel = car.tax_status ?? car.taxStatus ?? "";
  const isPlate =
    (car.status || "").toLowerCase() === "plate" || /plate|ស្លាក/i.test(taxLabel);
  if (isPlate) return { taxPaperCode: "", plateNumber: rawCode };
  return { taxPaperCode: rawCode, plateNumber: "" };
}

export function packCarIdentity(taxPaper: string, plate: string): { code: string; plateNumber: string } {
  const tax = taxPaper.trim();
  const p = plate.trim();
  if (tax && p) return { code: tax, plateNumber: p };
  if (tax) return { code: tax, plateNumber: "" };
  return { code: p, plateNumber: p };
}

export function packCarIdentityFallback(taxPaper: string, plate: string): string {
  const tax = taxPaper.trim();
  const p = plate.trim();
  if (tax && p) return `${tax}${CODE_PLATE_SEP}${p}`;
  return tax || p;
}

export function formatCarIdentity(car: { code?: string | null; plateNumber?: string | null }): string {
  const tax = (car.code ?? "").trim();
  const plate = (car.plateNumber ?? "").trim();
  if (tax && plate && tax !== plate) return `${tax} · ${plate}`;
  return tax || plate;
}

export function isMissingDbColumn(error: unknown, column: string): boolean {
  const message = String((error as { message?: string })?.message || "").toLowerCase();
  return message.includes(column.toLowerCase()) && (message.includes("column") || message.includes("schema cache"));
}

/** PostgREST PGRST204: "Could not find the 'origin' column of 'cars' in the schema cache" */
export function missingSchemaColumn(error: unknown, table = "cars"): string | null {
  const message = String((error as { message?: string })?.message || "");
  const tableRe = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = message.match(new RegExp(`Could not find the '([^']+)' column of '${tableRe}'`, "i"));
  return match?.[1] ?? null;
}

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
