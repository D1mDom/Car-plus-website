/** Maps display brand names to Simple Icons slugs for logo CDN. */
const BRAND_SLUGS: Record<string, string> = {
  Toyota: "toyota",
  Lexus: "lexus",
  Honda: "honda",
  BMW: "bmw",
  "Mercedes-Benz": "mercedes",
  Mercedes: "mercedes",
  Porsche: "porsche",
  Audi: "audi",
  Ford: "ford",
  Tesla: "tesla",
  Chevrolet: "chevrolet",
  Jeep: "jeep",
  Ferrari: "ferrari",
  Hyundai: "hyundai",
  Nissan: "nissan",
  Mazda: "mazda",
  Kia: "kia",
  Subaru: "subaru",
  Volkswagen: "volkswagen",
  Volvo: "volvo",
  Land: "landrover",
  "Range Rover": "landrover",
  Range: "landrover",
};

export const getBrandLogoSlug = (brand: string): string | null =>
  BRAND_SLUGS[brand] ?? BRAND_SLUGS[brand.split(/\s+/)[0] ?? ""] ?? null;

export const getBrandLogoUrl = (brand: string, color = "334155"): string | null => {
  const slug = getBrandLogoSlug(brand);
  if (!slug) return null;
  return `https://cdn.simpleicons.org/${slug}/${color.replace("#", "")}`;
};

export const getBrandInitial = (brand: string): string =>
  brand.trim().charAt(0).toUpperCase();
