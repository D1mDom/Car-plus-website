import type { Car, CarStatus, CarOrigin } from "@/hooks/useCars";
import { isFragileImageUrl, isHostedCarImageUrl } from "@/lib/fragileImageUrl";

const cleanPhotoUrl = (url: unknown): string =>
  typeof url === "string" ? url.trim() : "";

/** All usable photos: gallery first, then the cover column. */
export const getCarGallery = (car: Pick<Car, "image" | "images">): string[] => {
  const urls = (car.images ?? []).map(cleanPhotoUrl).filter(Boolean);
  if (urls.length > 0) return urls;
  const cover = cleanPhotoUrl(car.image);
  return cover ? [cover] : [];
};

/** Cover photo: prefer files we host, skip expired Facebook/Telegram links. */
export const getCarCoverImage = (car: Pick<Car, "image" | "images">): string => {
  const urls = getCarGallery(car);
  return (
    urls.find(isHostedCarImageUrl) ||
    urls.find((url) => !isFragileImageUrl(url)) ||
    urls[0] ||
    ""
  );
};

const BRAND_IN_NAME: [string, string][] = [
  ["mercedes-benz", "Mercedes-Benz"],
  ["mercedes-amg", "Mercedes-Benz"],
  ["rolls-royce", "Rolls-Royce"],
  ["land cruiser", "Toyota"],
  ["land rover", "Land Rover"],
  ["range rover", "Land Rover"],
  ["lamborghini", "Lamborghini"],
  ["mercedes", "Mercedes-Benz"],
  ["cadillac", "Cadillac"],
  ["porsche", "Porsche"],
  ["ferrari", "Ferrari"],
  ["mclaren", "McLaren"],
  ["bentley", "Bentley"],
  ["toyota", "Toyota"],
  ["lexus", "Lexus"],
  ["luxes", "Lexus"],
  ["brabus", "Mercedes-Benz"],
  ["tesla", "Tesla"],
];

const MODEL_TO_BRAND: Record<string, string> = {
  prius: "Toyota",
  pruis: "Toyota",
  camry: "Toyota",
  alphard: "Toyota",
  fortuner: "Toyota",
  highlander: "Toyota",
  raize: "Toyota",
  revo: "Toyota",
  toyotaprius: "Toyota",
  nx: "Lexus",
  nx200t: "Lexus",
  nx350: "Lexus",
  ct: "Lexus",
  ct200h: "Lexus",
  gs: "Lexus",
  hs: "Lexus",
  rx: "Lexus",
  rx400h: "Lexus",
  lm350h: "Lexus",
  cla45: "Mercedes-Benz",
  mg7: "MG",
};

export const extractBrand = (name: string): string => {
  const folded = foldBrandText(name);
  if (!folded) return "";
  const lower = folded.toLowerCase();
  for (const [needle, label] of BRAND_IN_NAME) {
    if (lower.includes(needle)) return label;
  }
  const first = folded.split(/\s+/)[0] ?? "";
  const key = brandKey(first);
  if (MODEL_TO_BRAND[key]) return MODEL_TO_BRAND[key];
  if (key.startsWith("mercedes") || key === "amg") return "Mercedes-Benz";
  if (key === "avatr" || key === "avatar") return "Avatr";
  if (key === "rolls" || key.startsWith("rolls")) return "Rolls-Royce";
  if (key === "bmw") return "BMW";
  if (key === "gac") return "GAC";
  if (key === "mg") return "MG";
  if (key === "byd") return "BYD";
  if (key === "gmc") return "GMC";
  if (key === "mini") return "MINI";
  return titleBrandToken(first);
};

const MATH_LETTER_BLOCKS = [
  0x1d400, 0x1d434, 0x1d468, 0x1d49c, 0x1d4d0, 0x1d504, 0x1d538, 0x1d56c, 0x1d5a0, 0x1d5d4, 0x1d608, 0x1d63c, 0x1d670,
];

const mapMathLetter = (cp: number): string | null => {
  if (cp < 0x1d400 || cp > 0x1d6a3) return null;
  for (const start of MATH_LETTER_BLOCKS) {
    const i = cp - start;
    if (i >= 0 && i < 52) return String.fromCharCode(i < 26 ? 65 + i : 97 + (i - 26));
  }
  return null;
};

/** Strip fancy Unicode letters / extra space so "𝗕𝗠𝗪" and "BMW" are the same brand. */
export const foldBrandText = (raw: string): string => {
  let out = "";
  for (const ch of raw.normalize("NFKC")) {
    const cp = ch.codePointAt(0) ?? 0;
    const mapped = mapMathLetter(cp);
    if (mapped) {
      out += mapped;
      continue;
    }
    if (cp >= 0xff21 && cp <= 0xff3a) {
      out += String.fromCharCode(cp - 0xff21 + 65);
      continue;
    }
    if (cp >= 0xff41 && cp <= 0xff5a) {
      out += String.fromCharCode(cp - 0xff41 + 97);
      continue;
    }
    out += ch;
  }
  return out.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
};

const brandKey = (value: string): string =>
  foldBrandText(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "");

const titleBrandToken = (token: string): string =>
  foldBrandText(token)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("-");

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
  const wanted = brandKey(brand);
  if (!wanted) return false;
  if (brandKey(extractBrand(carName)) === wanted) return true;
  const foldedName = foldBrandText(carName).toLowerCase();
  if (foldedName === wanted) return true;
  if (foldedName.startsWith(`${wanted} `)) return true;
  if (foldedName.startsWith(wanted) && foldedName.length > wanted.length) {
    const next = foldedName[wanted.length];
    if (!/[a-z]/.test(next)) return true;
  }
  return false;
};

export const filterCarsByBrand = (cars: Car[], brand: string | null): Car[] => {
  if (!brand) return cars;
  return cars.filter((c) => carMatchesBrand(c.name, brand));
};

export const filterCarsByOrigin = (cars: Car[], origin: CarOrigin | null): Car[] => {
  if (!origin) return cars;
  return cars.filter((c) => (c.origin ?? "local") === origin);
};

export const countCarsByOrigin = (cars: Car[]): Record<CarOrigin | "all", number> => {
  const base = publicCars(cars);
  const counts = { all: base.length, local: 0, thai: 0, import: 0 };
  for (const car of base) {
    counts[car.origin ?? "local"]++;
  }
  return counts;
};

export const STATUS_CATEGORIES: CarStatus[] = ["onroad", "ready", "luxury", "plate"];

const STATUS_ALIASES: Record<string, CarStatus> = {
  ready: "ready",
  onroad: "onroad",
  "on-road": "onroad",
  "on the road": "onroad",
  luxury: "luxury",
  plate: "plate",
  "with plates": "plate",
  "with plate": "plate",
};

export const normalizeCarStatus = (raw: string | null | undefined): CarStatus => {
  const value = (raw ?? "").trim().toLowerCase();
  if (value in STATUS_ALIASES) return STATUS_ALIASES[value];
  if (value.includes("onroad") || value.includes("on the road") || value.includes("មិនទាន់")) return "onroad";
  if (value.includes("plate") || value.includes("ស្លាក")) return "plate";
  if (value.includes("luxury") || value.includes("ក្រដាស")) return "luxury";
  if (value.includes("ready") || value.includes("រួចរាល់")) return "ready";
  return "ready";
};

export const isPlateCategoryCar = (car: Car): boolean => {
  if (car.plateNumber?.trim()) return true;
  if (normalizeCarStatus(car.status) === "plate") return true;
  return /plate|ស្លាក/i.test(car.taxStatus ?? "");
};

export const isTaxPaperCategoryCar = (car: Car): boolean => {
  if (car.code?.trim()) return true;
  if (normalizeCarStatus(car.status) === "luxury") return true;
  return /tax\s*paper|ក្រដាស/i.test(car.taxStatus ?? "");
};

export const carMatchesCategory = (car: Car, category: CarStatus | "all"): boolean => {
  if (!category || category === "all") return true;
  if (category === "plate") return isPlateCategoryCar(car);
  if (category === "luxury") return isTaxPaperCategoryCar(car);
  return normalizeCarStatus(car.status) === category;
};

export const getPublicCars = (cars: Car[]): Car[] => publicCars(cars);

export const getCarsByStatus = (
  cars: Car[],
  status: CarStatus,
  limit?: number,
): Car[] => {
  const list = publicCars(cars).filter((c) => carMatchesCategory(c, status));
  return limit === undefined ? list : list.slice(0, limit);
};

export const countCarsByStatus = (cars: Car[]): Record<CarStatus | "all", number> => {
  const base = publicCars(cars);
  const counts = { all: base.length, onroad: 0, ready: 0, luxury: 0, plate: 0 };
  for (const car of base) {
    if (carMatchesCategory(car, "onroad")) counts.onroad++;
    if (carMatchesCategory(car, "ready")) counts.ready++;
    if (carMatchesCategory(car, "luxury")) counts.luxury++;
    if (carMatchesCategory(car, "plate")) counts.plate++;
  }
  return counts;
};

const BODY_TYPE_ALIASES: Record<string, string> = {
  sedan: "Sedan",
  suv: "SUV",
  hatchback: "Hatchback",
  coupe: "Coupe",
  truck: "Truck",
  van: "Van",
  pickup: "Pickup",
  "pick-up": "Pickup",
  "pick up": "Pickup",
  sports: "Sports",
  sport: "Sports",
  convertible: "Convertible",
  "សេដង់": "Sedan",
  "សេដាន់": "Sedan",
  "អេសយូវី": "SUV",
  "ហាតឆប៊ែក": "Hatchback",
  "គូប៉េ": "Coupe",
  "ពិកអាប់": "Pickup",
  "ឡានដឹក": "Truck",
  "វ៉ាន់": "Van",
  "ស្ព័រ": "Sports",
  "កាប៉ូ": "Convertible",
};

export const BODY_TYPE_ORDER = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Coupe",
  "Pickup",
  "Truck",
  "Van",
  "Sports",
  "Convertible",
] as const;

export const normalizeBodyType = (raw: string | null | undefined): string => {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  return BODY_TYPE_ALIASES[value.toLowerCase()] ?? BODY_TYPE_ALIASES[value] ?? value;
};

export const carMatchesBodyType = (car: Car, bodyType: string | "all"): boolean => {
  if (!bodyType || bodyType === "all") return true;
  const wanted = normalizeBodyType(bodyType);
  const actual = normalizeBodyType(car.bodyType);
  if (!wanted) return true;
  if (actual === wanted) return true;
  // Pickup and truck are stored both ways in this inventory.
  if ((wanted === "Truck" || wanted === "Pickup") && (actual === "Truck" || actual === "Pickup")) {
    return true;
  }
  return actual.toLowerCase() === wanted.toLowerCase();
};

export const carMatchesBodySearch = (car: Car, query: string, typeLabel: (type: string) => string): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const raw = (car.bodyType ?? "").toLowerCase();
  const normalized = normalizeBodyType(car.bodyType);
  const label = typeLabel(normalized || car.bodyType).toLowerCase();
  const name = car.name.toLowerCase();
  const model = car.model.toLowerCase();
  const code = (car.code ?? "").toLowerCase();
  const plate = (car.plateNumber ?? "").toLowerCase();
  return (
    raw.includes(needle) ||
    normalized.toLowerCase().includes(needle) ||
    label.includes(needle) ||
    name.includes(needle) ||
    model.includes(needle) ||
    code.includes(needle) ||
    plate.includes(needle)
  );
};

export const listBodyTypes = (cars: Car[]): string[] => {
  const found = new Set<string>();
  for (const car of cars) {
    const type = normalizeBodyType(car.bodyType);
    if (type) found.add(type);
  }
  const ordered = BODY_TYPE_ORDER.filter((type) => found.has(type));
  const extra = [...found].filter((type) => !BODY_TYPE_ORDER.includes(type as (typeof BODY_TYPE_ORDER)[number])).sort();
  return [...ordered, ...extra];
};

export const listCarBrands = (cars: Car[]): string[] => {
  const seen = new Map<string, string>();
  for (const car of cars) {
    const brand = extractBrand(car.name);
    if (!brand) continue;
    const key = brandKey(brand);
    if (!key || seen.has(key)) continue;
    seen.set(key, brand);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
};

export const carMatchesSelectedBrand = (car: Car, brand: string | "all" | null): boolean => {
  if (!brand || brand === "all") return true;
  return carMatchesBrand(car.name, brand);
};

export const carMatchesBrandSearch = (car: Car, query: string): boolean => {
  const needle = foldBrandText(query).toLowerCase();
  if (!needle) return true;
  const brand = extractBrand(car.name).toLowerCase();
  const name = foldBrandText(car.name).toLowerCase();
  const model = foldBrandText(car.model).toLowerCase();
  return brand.includes(needle) || name.includes(needle) || model.includes(needle);
};
