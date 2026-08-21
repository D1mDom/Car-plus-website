import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DigitalAlertTone = "brand" | "success" | "danger";

const TONE: Record<
  DigitalAlertTone,
  { bar: string; icon: string; eyebrow: string; primary: string }
> = {
  brand: {
    bar: "bg-[#174080]",
    icon: "bg-[#174080]/10 text-[#174080]",
    eyebrow: "text-[#174080]",
    primary: "bg-[#174080] text-white hover:bg-[#143871]",
  },
  success: {
    bar: "bg-emerald-600",
    icon: "bg-emerald-500/12 text-emerald-700",
    eyebrow: "text-emerald-700",
    primary: "bg-[#174080] text-white hover:bg-[#143871]",
  },
  danger: {
    bar: "bg-red-600",
    icon: "bg-red-500/12 text-red-600",
    eyebrow: "text-red-600",
    primary: "bg-red-600 text-white hover:bg-red-700",
  },
};

type Action = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
};

type DigitalAlertProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tone?: DigitalAlertTone;
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  primary?: Action;
  secondary?: Action;
  dismissLabel?: string;
};

export const digitalAlertContentClass =
  "max-w-[min(calc(100vw-1.5rem),22.5rem)] gap-0 overflow-hidden rounded-2xl border border-[#174080]/12 bg-card p-0 shadow-[0_24px_64px_-28px_rgba(15,45,92,0.5)] sm:rounded-2xl";

const DigitalAlert = ({
  open,
  onOpenChange,
  tone = "brand",
  eyebrow,
  title,
  description,
  icon,
  children,
  primary,
  secondary,
  dismissLabel,
}: DigitalAlertProps) => {
  const colors = TONE[tone];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={digitalAlertContentClass}>
        <span className={cn("block h-1 w-full", colors.bar)} aria-hidden />
        <div className="px-5 pb-5 pt-5">
          {icon ? (
            <span className={cn("mb-3 flex h-11 w-11 items-center justify-center rounded-xl", colors.icon)}>
              {icon}
            </span>
          ) : null}
          {eyebrow ? (
            <p className={cn("mb-1 text-[11px] font-semibold uppercase tracking-[0.16em]", colors.eyebrow)}>
              {eyebrow}
            </p>
          ) : null}
          <DialogTitle className="font-heading text-lg font-semibold leading-snug tracking-tight">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          ) : null}
          {children ? <div className="mt-4">{children}</div> : null}
          <div className="mt-5 flex flex-col gap-2">
            {primary ? (
              <Button className={cn("h-10 w-full gap-2 rounded-xl", colors.primary)} onClick={primary.onClick}>
                {primary.icon}
                {primary.label}
              </Button>
            ) : null}
            {secondary ? (
              <Button variant="outline" className="h-10 w-full gap-2 rounded-xl" onClick={secondary.onClick}>
                {secondary.icon}
                {secondary.label}
              </Button>
            ) : null}
            {dismissLabel ? (
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-full rounded-xl text-sm text-muted-foreground hover:text-foreground"
                onClick={() => onOpenChange(false)}
              >
                {dismissLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DigitalAlert;
