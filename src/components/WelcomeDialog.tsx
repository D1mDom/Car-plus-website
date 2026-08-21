import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Car, Phone, ShieldCheck, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";
import logo from "@/assets/logo.png";

const SEEN_KEY = "carplus-welcome-seen-v4";
export const SHOW_WELCOME_EVENT = "carplus-show-welcome";

const WelcomeDialog = () => {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { popupNotice } = useCustomerNotifications();
  const [open, setOpen] = useState(false);

  const isPublicSite = !pathname.startsWith("/admin");
  const skipPage = pathname.startsWith("/auth") || pathname.startsWith("/reset-password");

  useEffect(() => {
    if (!isPublicSite || skipPage || popupNotice) {
      setOpen(false);
      return;
    }
    try {
      if (localStorage.getItem(SEEN_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(timer);
  }, [isPublicSite, skipPage, popupNotice]);

  useEffect(() => {
    const onShow = () => {
      if (!isPublicSite || skipPage) return;
      setOpen(true);
    };
    window.addEventListener(SHOW_WELCOME_EVENT, onShow);
    return () => window.removeEventListener(SHOW_WELCOME_EVENT, onShow);
  }, [isPublicSite, skipPage]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

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
      <DialogContent className="max-w-[min(calc(100vw-1.5rem),28rem)] gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:max-w-md sm:rounded-2xl [&>button]:right-4 [&>button]:top-4 [&>button]:text-white/70 [&>button]:hover:text-white [&>button]:focus:ring-offset-0">
        <div className="relative overflow-hidden bg-[#174080] px-6 pb-7 pt-6 text-white">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10 blur-xl"
            aria-hidden
          />

          <div className="relative">
            <img
              src={logo}
              alt="Car Plus"
              className="h-11 w-11 rounded-lg bg-white object-contain p-1 shadow-md"
            />
            <DialogTitle className="mt-4 text-[1.65rem] font-bold leading-tight tracking-tight text-white">
              {t("welcome.title")}
            </DialogTitle>
            <DialogDescription className="mt-2 text-[0.95rem] leading-relaxed text-white/90">
              {t("welcome.subtitle")}
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-5 bg-white px-6 py-6">
          <p className="text-sm leading-relaxed text-slate-600">{t("welcome.body")}</p>

          <ul className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#174080]/10">
                  <Icon className="h-4 w-4 text-[#174080]" />
                </span>
                <span className="leading-snug">{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2.5">
            <Button
              className="h-11 flex-1 gap-2 rounded-xl bg-[#174080] text-white hover:bg-[#143871]"
              onClick={() => {
                dismiss();
                navigate("/cars");
              }}
            >
              {t("welcome.browse")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-11 flex-1 gap-2 rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              onClick={() => {
                dismiss();
                navigate("/contact");
              }}
            >
              <Phone className="h-4 w-4" />
              {t("welcome.contact")}
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl border-[#174080]/40 text-sm font-medium text-[#174080] hover:bg-[#174080]/5"
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
