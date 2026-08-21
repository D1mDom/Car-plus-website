import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Database, Loader2, RefreshCw, Flame, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DataMenuRow from "@/components/DataMenuRow";
import { SHOW_WELCOME_EVENT } from "@/components/WelcomeDialog";
import { useLanguage } from "@/hooks/useLanguage";
import { clearAppCache } from "@/lib/clearAppCache";
import { cn } from "@/lib/utils";

const SITE_QUERY_PREFIXES = ["cars", "banners", "contact-info", "brands", "team-members"] as const;
const ADMIN_QUERY_PREFIXES = [
  "cars",
  "admin-orders",
  "admin-receipts",
  "reports",
  "banners",
  "team-members",
  "contact-info",
  "brands",
] as const;

type DataAction = "refresh" | "warm" | "clear" | null;
type AppDataMenuScope = "site" | "admin";
type AppDataMenuTone = "admin" | "site";

type AppDataMenuProps = {
  scope?: AppDataMenuScope;
  tone?: AppDataMenuTone;
  className?: string;
  onAction?: () => void;
  variant?: "dropdown" | "inline";
};

function InlineDataRow({
  icon: Icon,
  title,
  description,
  tone,
  busy,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "brand" | "green" | "red";
  busy?: boolean;
  onClick: () => void;
}) {
  const tones = {
    brand: { icon: "bg-[#174080]/12 text-[#174080]", title: "text-[#174080]" },
    green: { icon: "bg-emerald-50 text-emerald-600", title: "text-emerald-700" },
    red: { icon: "bg-red-50 text-red-600", title: "text-red-600" },
  }[tone];

  return (
    <button
      type="button"
      className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#174080]/8 disabled:opacity-60"
      onClick={onClick}
      disabled={busy}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones.icon)}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
      </span>
      <span className="min-w-0 pt-0.5">
        <span className={cn("block text-sm font-semibold leading-tight", tones.title)}>{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{description}</span>
      </span>
    </button>
  );
}

const QUERY_PREFIXES: Record<AppDataMenuScope, readonly string[]> = {
  site: SITE_QUERY_PREFIXES,
  admin: ADMIN_QUERY_PREFIXES,
};

const AppDataMenu = ({
  scope = "site",
  tone = "site",
  className,
  onAction,
  variant = "dropdown",
}: AppDataMenuProps) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [dataAction, setDataAction] = useState<DataAction>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const prefixes = QUERY_PREFIXES[scope];

  const handleRefreshData = useCallback(async () => {
    if (dataAction) return;
    setDataAction("refresh");
    try {
      await queryClient.invalidateQueries();
      await queryClient.refetchQueries({ type: "active" });
      toast.success(t("admin.data.refreshDone"));
      setMenuOpen(false);
      onAction?.();
      if (scope === "site") {
        window.dispatchEvent(new Event(SHOW_WELCOME_EVENT));
      }
    } catch {
      toast.error(t("admin.data.error"));
    } finally {
      setDataAction(null);
    }
  }, [dataAction, onAction, queryClient, scope, t]);

  const handleWarmCache = useCallback(async () => {
    if (dataAction) return;
    setDataAction("warm");
    try {
      await Promise.all(
        prefixes.map((prefix) => queryClient.refetchQueries({ queryKey: [prefix], type: "all" })),
      );
      toast.success(t("admin.data.warmDone"));
      setMenuOpen(false);
      onAction?.();
    } catch {
      toast.error(t("admin.data.error"));
    } finally {
      setDataAction(null);
    }
  }, [dataAction, onAction, prefixes, queryClient, t]);

  const handleClearCache = useCallback(async () => {
    if (dataAction) return;
    setDataAction("clear");
    setMenuOpen(false);
    onAction?.();
    toast.message(t("admin.data.clearing"));
    try {
      await clearAppCache(queryClient);
    } catch {
      window.location.reload();
    }
  }, [dataAction, onAction, queryClient, t]);

  const menuBody = (
    <>
      <DropdownMenuLabel className="px-2 py-2 text-base font-semibold text-[#174080]">
        {t("admin.data.title")}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DataMenuRow
        icon={RefreshCw}
        title={t("admin.data.refresh")}
        description={t("admin.data.refreshDesc")}
        tone="brand"
        busy={dataAction === "refresh"}
        onClick={() => void handleRefreshData()}
      />
      <DataMenuRow
        icon={Flame}
        title={t("admin.data.warm")}
        description={t("admin.data.warmDesc")}
        tone="green"
        busy={dataAction === "warm"}
        onClick={() => void handleWarmCache()}
      />
      <DropdownMenuSeparator />
      <DataMenuRow
        icon={Trash2}
        title={t("admin.data.clear")}
        description={t("admin.data.clearDesc")}
        tone="red"
        busy={dataAction === "clear"}
        onClick={() => void handleClearCache()}
      />
    </>
  );

  if (variant === "inline") {
    return (
      <div className={cn("space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm", className)}>
        <p className="px-2 py-1.5 text-base font-semibold text-[#174080]">{t("admin.data.title")}</p>
        <InlineDataRow
          icon={RefreshCw}
          title={t("admin.data.refresh")}
          description={t("admin.data.refreshDesc")}
          tone="brand"
          busy={dataAction === "refresh"}
          onClick={() => void handleRefreshData()}
        />
        <InlineDataRow
          icon={Flame}
          title={t("admin.data.warm")}
          description={t("admin.data.warmDesc")}
          tone="green"
          busy={dataAction === "warm"}
          onClick={() => void handleWarmCache()}
        />
        <div className="my-1 h-px bg-slate-100" />
        <InlineDataRow
          icon={Trash2}
          title={t("admin.data.clear")}
          description={t("admin.data.clearDesc")}
          tone="red"
          busy={dataAction === "clear"}
          onClick={() => void handleClearCache()}
        />
      </div>
    );
  }

  const triggerClass =
    tone === "admin"
      ? "h-9 w-9 text-[hsl(var(--sidebar-foreground))]/75 hover:bg-[#174080]/20 hover:text-white"
      : "h-9 w-9 text-[hsl(244_30%_40%)] hover:bg-[#174080]/12 hover:text-[#174080] active:bg-[#174080]/20 active:text-[#143871]";

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className={cn(triggerClass, className)}
          title={t("admin.data.title")}
          aria-label={t("admin.data.title")}
          disabled={!!dataAction}
        >
          {dataAction ? (
            <Loader2 className="h-[1.15rem] w-[1.15rem] animate-spin" />
          ) : (
            <Database className="h-[1.15rem] w-[1.15rem]" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(calc(100vw-2rem),17.5rem)] rounded-2xl border-slate-200 p-2 shadow-xl"
      >
        {menuBody}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AppDataMenu;
