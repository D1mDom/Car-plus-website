import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const SiteSettingsMenu = ({ className }: { className?: string }) => {
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 text-[hsl(244_30%_40%)] hover:bg-[#174080]/12 hover:text-[#174080]",
            className,
          )}
          title={t("settings.title")}
          aria-label={t("settings.title")}
        >
          <Settings className="h-[18px] w-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[60] w-[min(calc(100vw-1.5rem),18rem)] rounded-2xl p-0"
      >
        <DropdownMenuLabel className="px-4 py-3 font-normal">
          <p className="text-sm font-semibold text-[#174080]">{t("settings.title")}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="space-y-4 px-4 py-3.5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("settings.appearance")}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("settings.appearanceHint")}
            </p>
            <ThemeModeToggle />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SiteSettingsMenu;
