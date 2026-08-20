import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { usePlaceOrder } from "@/hooks/usePlaceOrder";
import { useOrderAlert } from "@/hooks/useOrderAlert";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import type { Car } from "@/hooks/useCars";
import {
  ArrowRight,
  Car as CarIcon,
  CheckCircle2,
  Clock3,
  Phone,
  Send,
  Shield,
  User,
} from "lucide-react";
import SafeImg from "@/components/SafeImg";
import { getCarCoverImage } from "@/lib/carUtils";
import { cleanPhoneInput, formatPhoneDisplay, isValidPhone } from "@/lib/phoneUtils";
import {
  sanitizeCustomerName,
  sanitizeOrderNote,
  sanitizeTelegram,
} from "@/lib/orderSecurity";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

interface PlaceOrderDialogProps {
  car: Car | null;
  onOpenChange: (open: boolean) => void;
}

const TIMES = ["morning", "afternoon", "evening", "anytime"] as const;

const PlaceOrderDialog = ({ car, onOpenChange }: PlaceOrderDialogProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [note, setNote] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const placeOrder = usePlaceOrder();
  const { showOrderAlert } = useOrderAlert();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (car) {
      setName(
        profile?.full_name
          || (user?.user_metadata?.full_name as string)
          || ""
      );
      const rawPhone =
        profile?.phone
        || (typeof user?.user_metadata?.phone === "string" ? user.user_metadata.phone : "")
        || "";
      setPhone(formatPhoneDisplay(cleanPhoneInput(rawPhone)));
      setTelegram(profile?.telegram?.replace(/^@/, "") ?? "");
      setPreferredTime(profile?.preferred_time ?? "");
      setNote("");
      setContactConsent(false);
      setSubmitted(false);
      setTouched(false);
    }
  }, [
    car,
    profile?.phone,
    profile?.full_name,
    profile?.telegram,
    profile?.preferred_time,
    user?.user_metadata?.full_name,
    user?.user_metadata?.phone,
  ]);

  const cleanPhone = (v: string) => formatPhoneDisplay(cleanPhoneInput(v));
  const nameOk = name.trim().length >= 2;
  const phoneOk = isValidPhone(phone);
  const formOk = nameOk && phoneOk && contactConsent;

  const close = () => {
    onOpenChange(false);
    setName("");
    setPhone("");
    setTelegram("");
    setPreferredTime("");
    setNote("");
    setContactConsent(false);
    setTouched(false);
    setSubmitted(false);
  };

  const submit = () => {
    setTouched(true);
    if (!car || !formOk) return;
    placeOrder.mutate(
      {
        car,
        customerName: name.trim(),
        phone: phone.trim(),
        telegram: telegram.trim() || undefined,
        preferredTime: preferredTime || undefined,
        note: note.trim() || undefined,
      },
      { onSuccess: () => {
          setSubmitted(true);
          showOrderAlert({
            carId: String(car.id),
            carName: car.name,
            carPrice: car.price,
            carImage: getCarCoverImage(car),
          });
        } }
    );
  };

  return (
    <Dialog open={!!car} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1.25rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/70 px-5 py-4 pr-12 text-left">
          <DialogTitle className="font-heading text-xl">
            {submitted ? t("order.dialog.successTitle") : t("order.dialog.title")}
          </DialogTitle>
          {!submitted && (
            <DialogDescription className="text-sm leading-relaxed">
              {t("order.dialog.subtitle")}
            </DialogDescription>
          )}
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 px-5 py-5">
            <div className="flex flex-col items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-6 text-center">
              <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-600" />
              <p className="font-heading font-semibold text-foreground">{t("order.dialog.successHeadline")}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("order.dialog.contactNotice")}
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-[#174080]" />
                {t("order.dialog.viaPhone")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-[#229ED9]" />
                {t("order.dialog.viaTelegram")}
              </span>
            </div>
            <Button asChild className="h-11 w-full gap-2 bg-[#174080] hover:bg-[#143871]">
              <Link to="/orders" onClick={close}>
                {t("orders.viewMyOrders")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="h-11 w-full" onClick={close}>
              {t("order.dialog.done")}
            </Button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {car && (
                <div className="mb-4 flex gap-3 overflow-hidden rounded-2xl border border-border/70 bg-muted/25 p-2.5">
                  {getCarCoverImage(car) ? (
                    <SafeImg
                      src={getCarCoverImage(car)}
                      alt={car.name}
                      className="h-[4.75rem] w-[5.75rem] shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-[4.75rem] w-[5.75rem] shrink-0 items-center justify-center rounded-xl bg-[#174080]/10 text-[#174080]">
                      <CarIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 self-center">
                    <p className="font-heading text-sm font-semibold leading-snug text-foreground">
                      {car.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[car.year, car.model].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <p className="font-heading text-lg font-bold leading-none text-[#174080]">
                        ${car.price.toLocaleString()}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <Shield className="h-3 w-3" />
                        {t("order.dialog.noPayment")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="order-name">
                      {t("order.dialog.nameLabel")}
                      <span className="ml-0.5 text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="order-name"
                        value={name}
                        onChange={(e) => setName(sanitizeCustomerName(e.target.value))}
                        placeholder={t("order.dialog.namePlaceholder")}
                        autoFocus
                        maxLength={120}
                        className="h-11 rounded-xl pl-9"
                      />
                    </div>
                    {touched && !nameOk && (
                      <p className="text-xs text-destructive">{t("order.dialog.nameInvalid")}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="order-phone">
                      {t("order.dialog.phoneLabel")}
                      <span className="ml-0.5 text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="order-phone"
                        value={phone}
                        inputMode="tel"
                        onChange={(e) => setPhone(cleanPhone(e.target.value))}
                        placeholder="0xx xxx xxx"
                        className="h-11 rounded-xl pl-9"
                      />
                    </div>
                    {touched && !phoneOk && (
                      <p className="text-xs text-destructive">{t("order.dialog.phoneInvalid")}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="order-telegram">
                    {t("order.dialog.telegramLabel")}
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({t("order.dialog.optional")})
                    </span>
                  </Label>
                  <div className="relative">
                    <Send className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#229ED9]" />
                    <Input
                      id="order-telegram"
                      value={telegram}
                      onChange={(e) => setTelegram(sanitizeTelegram(e.target.value))}
                      placeholder="username"
                      maxLength={32}
                      className="h-11 rounded-xl pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("order.dialog.timeLabel")}
                    <span className="font-normal text-muted-foreground">
                      ({t("order.dialog.optional")})
                    </span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TIMES.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setPreferredTime((prev) => (prev === time ? "" : time))}
                        className={cn(
                          "h-10 rounded-xl border text-xs font-semibold transition-colors",
                          preferredTime === time
                            ? "border-[#174080] bg-[#174080] text-white"
                            : "border-border bg-card text-foreground hover:border-[#174080]/40"
                        )}
                      >
                        {t(`order.dialog.time${time.charAt(0).toUpperCase()}${time.slice(1)}` as TranslationKey)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="order-note">
                    {t("order.dialog.noteLabel")}
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({t("order.dialog.optional")})
                    </span>
                  </Label>
                  <Textarea
                    id="order-note"
                    value={note}
                    onChange={(e) => setNote(sanitizeOrderNote(e.target.value))}
                    placeholder={t("order.dialog.notePlaceholder")}
                    rows={2}
                    maxLength={500}
                    className="resize-none rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 space-y-3 border-t border-border/70 bg-muted/25 px-5 py-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="order-consent"
                  checked={contactConsent}
                  onCheckedChange={(v) => setContactConsent(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="order-consent" className="cursor-pointer text-sm font-normal leading-relaxed">
                  {t("order.dialog.consentLabel")}
                </Label>
              </div>
              {touched && !contactConsent ? (
                <p className="text-xs text-destructive">{t("order.dialog.consentRequired")}</p>
              ) : null}

              <div className="flex gap-2">
                <Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={close}>
                  {t("auth.cancel")}
                </Button>
                <Button
                  className="h-11 flex-[1.4] rounded-xl bg-[#174080] hover:bg-[#143871]"
                  onClick={submit}
                  disabled={placeOrder.isPending}
                >
                  {placeOrder.isPending ? t("order.dialog.submitting") : t("order.dialog.submit")}
                </Button>
              </div>
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <Shield className="mt-0.5 h-3 w-3 shrink-0 text-[#174080]" />
                {t("order.dialog.privacyNotice")}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlaceOrderDialog;
