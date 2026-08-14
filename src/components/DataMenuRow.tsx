import { Loader2, type LucideIcon } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type DataMenuRowProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "brand" | "green" | "red";
  busy?: boolean;
  onClick: () => void;
};

const DataMenuRow = ({ icon: Icon, title, description, tone, busy, onClick }: DataMenuRowProps) => {
  const tones = {
    brand: {
      icon: "bg-[#174080]/12 text-[#174080]",
      title: "text-[#174080]",
      hover: "hover:bg-[#174080]/8 focus:bg-[#174080]/8",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600",
      title: "text-emerald-700",
      hover: "hover:bg-emerald-50/80 focus:bg-emerald-50/80",
    },
    red: {
      icon: "bg-[#174080]/12 text-[#174080]",
      title: "text-[#174080]",
      hover: "hover:bg-[#174080]/8 focus:bg-[#174080]/8",
    },
  }[tone];

  return (
    <DropdownMenuItem
      className={cn("cursor-pointer rounded-xl p-2", tones.hover)}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={busy}
    >
      <div className="flex w-full items-start gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones.icon)}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
        </span>
        <span className="min-w-0 pt-0.5">
          <span className={cn("block text-sm font-semibold leading-tight", tones.title)}>{title}</span>
          <span className="mt-0.5 block text-xs leading-snug text-slate-500">{description}</span>
        </span>
      </div>
    </DropdownMenuItem>
  );
};

export default DataMenuRow;
