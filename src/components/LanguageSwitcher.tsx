import { Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { Lang } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import flagEn from "@/assets/flags/flag-en.png";
import flagKh from "@/assets/flags/flag-kh.png";

const FlagImg = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) => (
  <img
    src={src}
    alt={alt}
    className={cn(
      "h-4 w-6 shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-black/10",
      className
    )}
    draggable={false}
  />
);

const OPTIONS: {
  value: Lang;
  code: string;
  titleKey: "lang.en.title" | "lang.km.title";
  nativeKey: "lang.en.native" | "lang.km.native";
  flag: string;
  flagAlt: string;
}[] = [
  {
    value: "en",
    code: "EN",
    titleKey: "lang.en.title",
    nativeKey: "lang.en.native",
    flag: flagEn,
    flagAlt: "English",
  },
  {
    value: "km",
    code: "ខ្មែរ",
    titleKey: "lang.km.title",
    nativeKey: "lang.km.native",
    flag: flagKh,
    flagAlt: "Khmer",
  },
];

interface LanguageSwitcherProps {
  className?: string;
  /** For dark overlays (e.g. admin login) */
  tone?: "default" | "light";
}

const LanguageSwitcher = ({ className, tone = "default" }: LanguageSwitcherProps) => {
  const { t, lang, setLang } = useLanguage();
  const current = OPTIONS.find((o) => o.value === lang) ?? OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-1.5 rounded-full px-2.5 font-semibold",
            tone === "light"
              ? "border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              : "border-border/80 bg-background text-foreground hover:border-[hsl(28_90%_58%/0.45)] hover:bg-[hsl(28_95%_62%/0.14)] hover:text-[hsl(24_80%_42%)] data-[state=open]:border-[hsl(28_90%_58%/0.55)] data-[state=open]:bg-[hsl(28_95%_62%/0.16)] data-[state=open]:text-[hsl(24_80%_42%)]",
            className
          )}
          aria-label={t("lang.select")}
        >
          <FlagImg src={current.flag} alt={current.flagAlt} />
          <span className="text-xs tracking-wide">{current.code}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-80" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[13.5rem] p-1.5">
        {OPTIONS.map(({ value, titleKey, nativeKey, flag, flagAlt }) => {
          const selected = lang === value;
          return (
            <DropdownMenuItem
              key={value}
              onClick={() => setLang(value)}
              className={cn(
                "cursor-pointer gap-3 rounded-lg px-2.5 py-2.5 focus:bg-[hsl(28_95%_62%/0.14)] focus:text-[hsl(24_80%_42%)]",
                selected && "bg-[hsl(28_95%_62%/0.14)] focus:bg-[hsl(28_95%_62%/0.2)]"
              )}
            >
              <FlagImg src={flag} alt={flagAlt} className="mt-0.5 h-5 w-7" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold leading-none text-foreground">
                  {t(titleKey)}
                </span>
                <span className="text-xs leading-none text-muted-foreground">
                  {t(nativeKey)}
                </span>
              </span>
              {selected && <Check className="h-4 w-4 shrink-0 text-[hsl(28_90%_52%)]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
