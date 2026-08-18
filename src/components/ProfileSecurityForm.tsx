import { useState, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

const ProfileSecurityForm = memo(function ProfileSecurityForm() {
  const { t } = useLanguage();
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t("profile.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }
    setSaving(true);
    const { error } = await updatePassword(newPassword);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success(t("profile.passwordSaved"));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          {t("profile.newPassword")}
        </Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("profile.saving")}
          </>
        ) : (
          t("profile.changePassword")
        )}
      </Button>
    </form>
  );
});

export default ProfileSecurityForm;
