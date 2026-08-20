import { useMemo, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCars } from "@/hooks/useCars";
import { carMatchesCategory } from "@/lib/carUtils";
import { useLanguage } from "@/hooks/useLanguage";
import { useCountUp } from "@/hooks/useCountUp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Sparkles, IdCard, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STAT_ICON_ANIM: Record<string, CSSProperties> = {
  car: { animation: "adminStatCarDrive 1.5s ease-in-out infinite", willChange: "transform" },
  check: { animation: "adminStatCheckPop 1.4s ease-in-out infinite", willChange: "transform" },
  sparkle: { animation: "adminStatSparkle 1.3s ease-in-out infinite", willChange: "transform" },
  money: { animation: "adminStatCoin 1.5s ease-in-out infinite", willChange: "transform" },
  plate: { animation: "adminStatCoin 1.5s ease-in-out infinite", willChange: "transform" },
};

function AdminStatStyles() {
  return (
    <style>{`
      @keyframes adminStatCarDrive {
        0%, 100% { transform: translateX(0) scale(1); }
        50% { transform: translateX(12px) scale(1.1); }
      }
      @keyframes adminStatCheckPop {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.4); }
      }
      @keyframes adminStatSparkle {
        0%, 100% { transform: rotate(0deg) scale(1); }
        25% { transform: rotate(-18deg) scale(1.15); }
        75% { transform: rotate(18deg) scale(1.15); }
      }
      @keyframes adminStatCoin {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(-16deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .admin-stat-icon-anim { animation: none !important; }
      }
    `}</style>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  iconKey,
  to,
  prefix = "",
  active = false,
  onGo,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
  iconKey?: keyof typeof STAT_ICON_ANIM;
  to: string;
  prefix?: string;
  active?: boolean;
  onGo: (to: string) => void;
}) {
  const n = useCountUp(value);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onGo(to)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onGo(to);
        }
      }}
      className={cn(
        "admin-card-hover relative z-10 h-full cursor-pointer border-border/70 shadow-sm transition-shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174080] focus-visible:ring-offset-2",
        active && "border-[#174080]/50 ring-2 ring-[#174080]/25 shadow-md"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {label}
          <span
            className={cn(
              "admin-stat-icon-anim pointer-events-none inline-flex h-9 w-9 items-center justify-center rounded-lg",
              tone
            )}
            style={iconKey ? STAT_ICON_ANIM[iconKey] : undefined}
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pointer-events-none">
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          {prefix}
          {n.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

const AdminStatCards = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { data: cars } = useCars();

  const realCars = useMemo(
    () => (cars ?? []).filter((c) => !String(c.id).startsWith("mock-")),
    [cars]
  );

  const isActive = (to: string) => {
    const [path, query = ""] = to.split("?");
    if (query) return pathname === path && search === `?${query}`;
    return pathname === path && search === "";
  };

  const go = (to: string) => {
    navigate(to);
  };

  return (
    <>
      <AdminStatStyles />
      <div className="admin-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("admin.cars.total")}
          value={realCars.length}
          icon={Car}
          tone="text-[#174080] bg-[#174080]/12"
          iconKey="car"
          to="/admin/cars"
          active={isActive("/admin/cars")}
          onGo={go}
        />
        <StatCard
          label={t("admin.cars.onroad")}
          value={realCars.filter((c) => carMatchesCategory(c, "onroad")).length}
          icon={Truck}
          tone="text-emerald-600 bg-emerald-500/10"
          iconKey="check"
          to="/admin/cars?status=onroad"
          active={isActive("/admin/cars?status=onroad")}
          onGo={go}
        />
        <StatCard
          label={t("admin.cars.luxury")}
          value={realCars.filter((c) => carMatchesCategory(c, "luxury")).length}
          icon={Sparkles}
          tone="text-amber-600 bg-amber-500/10"
          iconKey="sparkle"
          to="/admin/cars?status=luxury"
          active={isActive("/admin/cars?status=luxury")}
          onGo={go}
        />
        <StatCard
          label={t("admin.cars.plate")}
          value={realCars.filter((c) => carMatchesCategory(c, "plate")).length}
          icon={IdCard}
          tone="text-sky-600 bg-sky-500/10"
          iconKey="plate"
          to="/admin/cars?status=plate"
          active={isActive("/admin/cars?status=plate")}
          onGo={go}
        />
      </div>
    </>
  );
};

export default AdminStatCards;
