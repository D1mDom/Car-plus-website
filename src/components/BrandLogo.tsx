import { useState } from "react";
import { cn } from "@/lib/utils";
import { getBrandInitial, getBrandLogoUrl } from "@/lib/brandLogos";

interface BrandLogoProps {
  brand: string;
  logoUrl?: string | null;
  className?: string;
  iconClassName?: string;
}

const BrandLogo = ({ brand, logoUrl, className, iconClassName }: BrandLogoProps) => {
  const [failed, setFailed] = useState(false);
  const src = logoUrl || getBrandLogoUrl(brand);

  if (!src || failed) {
    return (
      <span
        className={cn(
          "font-heading text-lg font-bold text-primary",
          className
        )}
      >
        {getBrandInitial(brand)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={`${brand} logo`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("h-9 w-9 object-contain", iconClassName)}
    />
  );
};

export default BrandLogo;
