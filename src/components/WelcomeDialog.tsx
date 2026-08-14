import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Car, ShieldCheck, Sparkles, ArrowRight, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import logo from "@/assets/logo.png";

const WelcomeDialog = () => {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const isPublicSite = !pathname.startsWith("/admin");

  useEffect(() => {
    if (!isPublicSite) {
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [isPublicSite]);

  const dismiss = () => setOpen(false);

  if (!isPublicSite) return null;

  const features = [
    { icon: Car, text: t("welcome.feature1") },
    { icon: ShieldCheck, text: t("welcome.feature2") },
    { icon: Sparkles, text: t("welcome.feature3") },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent className="max-w-[min(calc(100vw-1.5rem),28rem)] gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-2xl sm:max-w-md">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#174080] via-[#1a4a99] to-[#0f2d5c] px-6 pb-8 pt-7 text-white">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10 blur-xl"
            aria-hidden
          />

          <div className="relative flex items-center gap-3">
            <img
              src={logo}
              alt="Car Plus"
              className="h-12 w-auto rounded-lg bg-white/95 p-1 shadow-md ring-1 ring-white/20"
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/70">
                Car Plus
              </p>
              <DialogTitle className="text-2xl font-bold leading-tight tracking-tight text-white">
                {t("welcome.title")}
              </DialogTitle>
            </div>
          </div>

          <DialogDescription className="relative mt-4 text-base leading-relaxed text-white/90">
            {t("welcome.subtitle")}
          </DialogDescription>
        </div>

        <div className="space-y-5 bg-white px-6 py-6">
          <p className="text-sm leading-relaxed text-slate-600">{t("welcome.body")}</p>

          <ul className="space-y-2.5">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#174080]/10">
                  <Icon className="h-4 w-4 text-[#174080]" />
                </span>
                <span className="pt-1 leading-snug">{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              className="h-11 flex-1 gap-2 rounded-xl bg-[#174080] text-white hover:bg-[#143871]"
              onClick={dismiss}
            >
              <Link to="/cars">
                {t("welcome.browse")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 flex-1 gap-2 rounded-xl border-[#174080]/25 text-[#174080] hover:bg-[#174080]/5"
              onClick={dismiss}
            >
              <Link to="/contact">
                <Phone className="h-4 w-4" />
                {t("welcome.contact")}
              </Link>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full rounded-xl text-sm text-muted-foreground hover:text-foreground"
            onClick={dismiss}
          >
            {t("welcome.dismiss")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;
