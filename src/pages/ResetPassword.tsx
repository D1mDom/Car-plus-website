import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import Header from "@/components/Header";
import logo from "@/assets/logo.png";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const { updatePassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const cleanPassword = (v: string) => v.replace(/[^\x20-\x7E]/g, "");
  const passwordSchema = z.string().min(6, t("auth.errorPasswordMin"));

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
      setChecking(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      setChecking(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: t("auth.validationError"), description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }
    if (password !== confirm) {
      toast({ title: t("auth.validationError"), description: t("auth.errorPasswordMatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      toast({ title: t("auth.resetFailed"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("auth.passwordUpdated"), description: t("auth.passwordUpdatedDesc") });
    await supabase.auth.signOut({ scope: "local" });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex items-center justify-center px-4 pb-16 pt-24">
        <Card className="w-full max-w-md border-2 border-border">
          <CardHeader className="text-center">
            <img src={logo} alt="Car Plus" className="mx-auto mb-4 h-16 w-auto rounded-lg" />
            <CardTitle className="text-2xl">{t("auth.resetPasswordTitle")}</CardTitle>
            <CardDescription>{t("auth.resetPasswordSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : ready ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(cleanPassword(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("auth.confirmNewPassword")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(cleanPassword(e.target.value))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("auth.savingPassword") : t("auth.savePassword")}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 py-4 text-center">
                <p className="text-sm text-muted-foreground">{t("auth.resetLinkInvalid")}</p>
                <Button onClick={() => navigate("/auth")} className="w-full">
                  {t("auth.backToSignIn")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ResetPassword;
