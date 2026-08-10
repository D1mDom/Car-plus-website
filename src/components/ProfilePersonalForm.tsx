import { useEffect, useRef, useState, memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useProfile, type Profile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Phone, MapPin, Mail } from "lucide-react";
import { toast } from "sonner";

type Props = {
  email: string;
  profile: Profile | null | undefined;
  avatarUrl: string;
  onSaved: (next: Profile) => void;
};

/**
 * Isolated form so typing name/phone does NOT re-render the whole Profile page.
 * Uses uncontrolled inputs for smooth keystrokes.
 */
const ProfilePersonalForm = memo(function ProfilePersonalForm({
  email,
  profile,
  avatarUrl,
  onSaved,
}: Props) {
  const { t } = useLanguage();
  const { save } = useProfile();
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const filledFor = useRef<string>("");
  const [saving, setSaving] = useState(false);

  // Fill inputs once when profile loads (never on every keystroke)
  useEffect(() => {
    const key = `${profile?.id ?? ""}|${profile?.updated_at ?? ""}|${email}`;
    if (filledFor.current === key) return;

    const metaName = profile?.full_name ?? "";
    const metaPhone = profile?.phone ?? "";
    const metaAddress = profile?.address ?? "";

    if (nameRef.current) nameRef.current.value = metaName;
    if (phoneRef.current) phoneRef.current.value = metaPhone;
    if (addressRef.current) addressRef.current.value = metaAddress;
    filledFor.current = key;
  }, [profile?.id, profile?.updated_at, profile?.full_name, profile?.phone, profile?.address, email]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const full_name = (nameRef.current?.value ?? "").trim();
    const phone = (phoneRef.current?.value ?? "").trim();
    const address = (addressRef.current?.value ?? "").trim();

    if (!full_name) {
      toast.error(t("profile.nameRequired"));
      nameRef.current?.focus();
      return;
    }
    if (!phone) {
      toast.error(t("profile.phoneRequired"));
      phoneRef.current?.focus();
      return;
    }
    if (phone.replace(/[^0-9]/g, "").length < 8) {
      toast.error(t("profile.phoneInvalid"));
      phoneRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const saved = await save.mutateAsync({
        full_name,
        phone,
        address,
        avatar_url: avatarUrl || profile?.avatar_url || null,
        telegram: profile?.telegram ?? "",
        preferred_time: profile?.preferred_time ?? "",
      });
      // Keep what user typed in the inputs
      if (nameRef.current) nameRef.current.value = saved.full_name ?? full_name;
      if (phoneRef.current) phoneRef.current.value = saved.phone ?? phone;
      if (addressRef.current) addressRef.current.value = saved.address ?? address;
      filledFor.current = `${saved.id}|${saved.updated_at}|${email}`;
      onSaved(saved);
      toast.success(t("profile.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.saveFail"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          {t("profile.email")}
        </Label>
        <Input id="email" value={email} disabled className="bg-muted" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName" className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          {t("profile.fullName")}
        </Label>
        <Input
          id="fullName"
          ref={nameRef}
          defaultValue=""
          placeholder={t("profile.fullNamePlaceholder")}
          autoComplete="name"
          spellCheck={false}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          {t("profile.phone")}
        </Label>
        <Input
          id="phone"
          ref={phoneRef}
          defaultValue=""
          placeholder={t("profile.phonePlaceholder")}
          autoComplete="tel"
          inputMode="tel"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          {t("profile.address")}
        </Label>
        <Textarea
          id="address"
          ref={addressRef}
          defaultValue=""
          placeholder={t("profile.addressPlaceholder")}
          rows={3}
        />
      </div>
      <Button type="submit" disabled={saving || save.isPending} className="w-full sm:w-auto">
        {saving || save.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("profile.saving")}
          </>
        ) : (
          t("profile.save")
        )}
      </Button>
    </form>
  );
});

export default ProfilePersonalForm;
