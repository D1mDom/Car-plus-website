import type { Car, CarStatus } from "@/hooks/useCars";

export const extractBrand = (name: string): string => {
  const first = name.trim().split(/\s+/)[0] ?? "";
  if (first === "Mercedes-AMG") return "Mercedes-Benz";
  if (first.startsWith("Mercedes")) return "Mercedes-Benz";
  return first;
};

/** Keep first occurrence of each car id (and code when present). */
export const dedupeCars = (cars: Car[]): Car[] => {
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  return cars.filter((car) => {
    if (seenIds.has(car.id)) return false;
    const code = car.code?.trim().toLowerCase();
    if (code && seenCodes.has(code)) return false;
    seenIds.add(car.id);
    if (code) seenCodes.add(code);
    return true;
  });
};

const publicCars = (cars: Car[]): Car[] =>
  dedupeCars(cars.filter((c) => c.isActive !== false));

export const getFeaturedCars = (cars: Car[], limit = 4): Car[] =>
  publicCars(cars)
    .sort((a, b) => {
      const score = (c: Car) => (c.status === "luxury" ? 2 : 0) + c.viewers / 1000;
      return score(b) - score(a);
    })
    .slice(0, limit);

export const getLatestCars = (
  cars: Car[],
  limit = 8,
  excludeIds: Iterable<string> = []
): Car[] => {
  const exclude = new Set(excludeIds);
  return publicCars(cars)
    .filter((c) => !exclude.has(c.id))
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    })
    .slice(0, limit);
};

export const carMatchesBrand = (carName: string, brand: string): boolean => {
  const normalizedBrand = brand.toLowerCase().trim();
  const normalizedName = carName.toLowerCase().trim();
  if (!normalizedBrand) return false;
  if (normalizedName === normalizedBrand) return true;
  if (extractBrand(carName).toLowerCase() === normalizedBrand) return true;
  if (normalizedName.startsWith(`${normalizedBrand} `)) return true;
  // e.g. brand "MG" matches car "MG7", "MG HS"
  if (normalizedName.startsWith(normalizedBrand) && normalizedName.length > normalizedBrand.length) {
    const next = normalizedName[normalizedBrand.length];
    if (!/[a-z]/.test(next)) return true;
  }
  return false;
};

export const filterCarsByBrand = (cars: Car[], brand: string | null): Car[] => {
  if (!brand) return cars;
  return cars.filter((c) => carMatchesBrand(c.name, brand));
};

export const STATUS_CATEGORIES: CarStatus[] = ["onroad", "ready", "luxury", "plate"];

export const getPublicCars = (cars: Car[]): Car[] => publicCars(cars);

export const getCarsByStatus = (
  cars: Car[],
  status: CarStatus,
  limit?: number,
): Car[] => {
  const list = publicCars(cars).filter((c) => c.status === status);
  return limit === undefined ? list : list.slice(0, limit);
};

export const countCarsByStatus = (cars: Car[]): Record<CarStatus | "all", number> => {
  const base = publicCars(cars);
  const counts = { all: base.length, onroad: 0, ready: 0, luxury: 0, plate: 0 };
  for (const car of base) counts[car.status]++;
  return counts;
};
