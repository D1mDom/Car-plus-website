import { ShieldCheck } from "lucide-react";
import type { Car } from "@/hooks/useCars";

interface AdminToolbarProps {
  cars: Car[];
}

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col leading-tight">
    <span className="text-sm font-bold text-foreground">{value}</span>
    <span className="text-[11px] text-muted-foreground">{label}</span>
  </div>
);

const AdminToolbar = ({ cars }: AdminToolbarProps) => {
  // Only count real (database) cars, not the demo fallback.
  const real = cars.filter((c) => !String(c.id).startsWith("mock-"));
  const total = real.length;
  const active = real.filter((c) => c.isActive).length;
  const value = real.reduce((sum, c) => sum + c.price, 0);

  return (
    <div className="sticky top-16 z-40 border-b border-primary/20 bg-accent/90 backdrop-blur">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            ADMIN
          </span>
          <div className="ml-1 flex items-center gap-4">
            <Stat label="ឡានសរុប" value={total} />
            <div className="h-7 w-px bg-border" />
            <Stat label="បង្ហាញ" value={active} />
            <div className="h-7 w-px bg-border" />
            <Stat label="តម្លៃសរុប" value={`$${value.toLocaleString()}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminToolbar;
