import { useEffect, useState, memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useProfile, type Profile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, Clock3 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  profile: Profile | null | undefined;
  avatarUrl: string;
  coverUrl: string;
  onSaved: (next: Profile) => void;
};

const ProfileContactForm = memo(function ProfileContactForm({
  profile,
  avatarUrl,
  coverUrl,
  onSaved,
}: Props) {
  const { t } = useLanguage();
  const { save } = useProfile();
  const [telegram, setTelegram] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    setTelegram(profile?.telegram ?? "");
    setPreferredTime(profile?.preferred_time ?? "");
    setReady(true);
  }, [profile, ready]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await save.mutateAsync({
        full_name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        address: profile?.address ?? "",
        avatar_url: avatarUrl || profile?.avatar_url || null,
        cover_url: coverUrl || profile?.cover_url || null,
        telegram,
        preferred_time: preferredTime,
      });
      setTelegram(saved.telegram ?? "");
      setPreferredTime(saved.preferred_time ?? "");
      onSaved(saved);
      toast.success(t("profile.contactSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.saveFail"));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="telegram" className="flex items-center gap-1.5">
          <Send className="h-3.5 w-3.5 text-muted-foreground" />
          {t("profile.telegram")}
        </Label>
        <Input
          id="telegram"
          value={telegram}
          onChange={(e) => setTelegram(e.target.value)}
          placeholder={t("profile.telegramPlaceholder")}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">{t("profile.telegramHint")}</p>
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
          {t("profile.preferredTime")}
        </Label>
        <Select
          value={preferredTime || "any"}
          onValueChange={(v) => setPreferredTime(v === "any" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("profile.preferredTimePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("profile.time.any")}</SelectItem>
            <SelectItem value="morning">{t("profile.time.morning")}</SelectItem>
            <SelectItem value="afternoon">{t("profile.time.afternoon")}</SelectItem>
            <SelectItem value="evening">{t("profile.time.evening")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
        {t("profile.contactAlsoUses")}
      </div>
      <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
        {save.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("profile.saving")}
          </>
        ) : (
          t("profile.saveContact")
        )}
      </Button>
    </form>
  );
});

export default ProfileContactForm;
