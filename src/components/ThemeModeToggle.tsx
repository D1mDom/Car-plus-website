import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const ThemeModeToggle = ({ className }: { className?: string }) => {
  const { t } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && (resolvedTheme ?? theme) === "dark";

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
          !isDark
            ? "border-[#174080] bg-[#174080] text-white shadow-sm"
            : "border-border bg-background text-foreground hover:border-[#174080]/40 hover:bg-[#174080]/8",
        )}
      >
        <Sun className="h-4 w-4" />
        {t("theme.light")}
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
          isDark
            ? "border-[#174080] bg-[#174080] text-white shadow-sm"
            : "border-border bg-background text-foreground hover:border-[#174080]/40 hover:bg-[#174080]/8",
        )}
      >
        <Moon className="h-4 w-4" />
        {t("theme.dark")}
      </button>
    </div>
  );
};

export default ThemeModeToggle;
