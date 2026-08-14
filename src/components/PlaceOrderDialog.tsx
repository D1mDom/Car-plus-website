import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlaceOrder } from "@/hooks/usePlaceOrder";
import { useOrderAlert } from "@/hooks/useOrderAlert";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import type { Car } from "@/hooks/useCars";
import { CheckCircle2, Info, Phone, Send, Shield } from "lucide-react";

interface PlaceOrderDialogProps {
  car: Car | null;
  onOpenChange: (open: boolean) => void;
}

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
      setPhone(
        profile?.phone
          || (typeof user?.user_metadata?.phone === "string" ? user.user_metadata.phone : "")
          || ""
      );
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

  const cleanPhone = (v: string) => v.replace(/[^0-9+\-\s()]/g, "");
  const nameOk = name.trim().length >= 2;
  const phoneOk = phone.trim().replace(/[^0-9]/g, "").length >= 8;
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
            carImage: car.image,
          });
        } }
    );
  };

  return (
    <Dialog open={!!car} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {submitted ? t("order.dialog.successTitle") : t("order.dialog.title")}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-5 text-center">
              <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-600" />
              <p className="font-semibold text-foreground">{t("order.dialog.successHeadline")}</p>
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
            <Button className="w-full" onClick={close}>
              {t("order.dialog.done")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {car && (
              <div className="rounded-lg border border-border p-3">
                <p className="font-medium">{car.name}</p>
                <p className="font-semibold text-primary">${car.price.toLocaleString()}</p>
              </div>
            )}

            <div className="flex gap-2.5 rounded-xl border border-sky-500/20 bg-sky-500/8 px-3 py-3 text-sm leading-relaxed text-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              <p>{t("order.dialog.contactNotice")}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="order-name">{t("order.dialog.nameLabel")}</Label>
                <Input
                  id="order-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("order.dialog.namePlaceholder")}
                  autoFocus
                />
                {touched && !nameOk && (
                  <p className="text-xs text-destructive">{t("order.dialog.nameInvalid")}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="order-phone">{t("order.dialog.phoneLabel")}</Label>
                <Input
                  id="order-phone"
                  value={phone}
                  onChange={(e) => setPhone(cleanPhone(e.target.value))}
                  placeholder="0xx xxx xxx"
                />
                {touched && !phoneOk && (
                  <p className="text-xs text-destructive">{t("order.dialog.phoneInvalid")}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="order-telegram">
                  {t("order.dialog.telegramLabel")}
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({t("order.dialog.optional")})
                  </span>
                </Label>
                <Input
                  id="order-telegram"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value.replace(/\s/g, ""))}
                  placeholder="@username"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  {t("order.dialog.timeLabel")}
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({t("order.dialog.optional")})
                  </span>
                </Label>
                <Select
                  value={preferredTime || undefined}
                  onValueChange={setPreferredTime}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("order.dialog.timePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">{t("order.dialog.timeMorning")}</SelectItem>
                    <SelectItem value="afternoon">{t("order.dialog.timeAfternoon")}</SelectItem>
                    <SelectItem value="evening">{t("order.dialog.timeEvening")}</SelectItem>
                    <SelectItem value="anytime">{t("order.dialog.timeAnytime")}</SelectItem>
                  </SelectContent>
                </Select>
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
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("order.dialog.notePlaceholder")}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/40 px-3 py-3">
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

            <div className="flex gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#174080]" />
              <p>{t("order.dialog.privacyNotice")}</p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={close}>
                {t("auth.cancel")}
              </Button>
              <Button onClick={submit} disabled={placeOrder.isPending}>
                {placeOrder.isPending ? t("order.dialog.submitting") : t("order.dialog.submit")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlaceOrderDialog;
