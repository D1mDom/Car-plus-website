import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useBrands, type Brand } from "@/hooks/useBrands";
import { useLanguage } from "@/hooks/useLanguage";
import BrandLogo from "@/components/BrandLogo";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { cn } from "@/lib/utils";

const CARD_GRADIENTS = [
  "from-[#7B6CF6] to-[#5B8DEF]",
  "from-[#4BA3E8] to-[#2E7BC4]",
  "from-[#F0786A] to-[#E85A8C]",
  "from-[#5EC97A] to-[#3AA55C]",
  "from-[#F0A04B] to-[#E07A3A]",
  "from-[#5B9BD5] to-[#3D6FA8]",
  "from-[#C45C8A] to-[#8E4A9E]",
  "from-[#2DB5A0] to-[#1A8F7A]",
];

const HOME_BRANDS = ["Toyota", "Lexus"] as const;

const PopularBrandsSection = () => {
  const { data: brands = [], isLoading } = useBrands();
  const { t } = useLanguage();

  const displayBrands = useMemo(() => {
    const list: Brand[] = [...brands];
    for (const name of [...HOME_BRANDS].reverse()) {
      const exists = list.some((b) => b.name.trim().toLowerCase() === name.toLowerCase());
      if (exists) continue;
      list.unshift({
        id: `home-${name.toLowerCase()}`,
        name,
        logo: getBrandLogoUrl(name) ?? "",
        sort_order: 0,
        is_active: true,
      });
    }
    return list;
  }, [brands]);

  if (isLoading || displayBrands.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto max-w-7xl px-[10px]">
        <div className="mb-6 text-center sm:mb-8">
          <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {t("home.brands.eyebrow")}
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("home.brands.title")}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {displayBrands.map((brand, index) => (
            <Link
              key={brand.id}
              to={`/cars?brand=${encodeURIComponent(brand.name)}`}
              className={cn(
                "group relative min-h-[140px] overflow-hidden rounded-[1.75rem] bg-gradient-to-br p-5 shadow-md",
                "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                "sm:min-h-[160px] sm:p-6",
                CARD_GRADIENTS[index % CARD_GRADIENTS.length]
              )}
            >
              {/* Concentric circles (reference style) */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full border-[28px] border-white/10 sm:h-48 sm:w-48 sm:border-[32px]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-2 -right-2 h-24 w-24 rounded-full border-[18px] border-white/10 sm:h-28 sm:w-28 sm:border-[20px]"
              />

              <div className="relative z-10 flex h-full min-h-[108px] flex-col justify-between sm:min-h-[120px]">
                <div className="pr-16">
                  <h3 className="font-heading text-lg font-bold leading-tight text-white drop-shadow-sm sm:text-xl">
                    {brand.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-white/85">
                    {t("home.brands.cardSub")}
                  </p>
                </div>

                <div className="absolute bottom-0 right-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2.5 shadow-lg transition-transform duration-300 group-hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]">
                  <BrandLogo
                    brand={brand.name}
                    logoUrl={brand.logo}
                    iconClassName="h-full w-full max-h-12 max-w-12 object-contain"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularBrandsSection;
