import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2, Shield, Sun, Moon } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const emailSchema = z.string().email("Invalid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { signIn, signOut, user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { t } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isDark = (resolvedTheme ?? theme) === "dark";

  useEffect(() => setMounted(true), []);

  const cleanEmail = (v: string) => v.replace(/[^a-zA-Z0-9@._%+-]/g, "");
  const cleanPassword = (v: string) => v.replace(/[^\x20-\x7E]/g, "");

  useEffect(() => {
    if (!authLoading && !adminLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Error", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      toast({
        title: "Login failed",
        description: error.message === "Invalid login credentials" ? "Invalid email or password" : error.message,
        variant: "destructive",
      });
      return;
    }

    const { data: { user: signedIn } } = await supabase.auth.getUser();
    if (!signedIn) {
      setLoading(false);
      toast({ title: "Login failed", description: "Could not verify account", variant: "destructive" });
      return;
    }

    const { data: adminOk, error: adminErr } = await supabase.rpc("is_admin", {
      _user_id: signedIn.id,
    });

    setLoading(false);

    if (adminErr || adminOk !== true) {
      await signOut();
      toast({
        title: "No admin access",
        description: "This account does not have dashboard permission.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Welcome!", description: "Signed in to dashboard" });
    navigate("/admin", { replace: true });
  };

  if (authLoading || (user && adminLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(216_60%_10%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(200_95%_52%)]" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(216_60%_10%)] px-[10px]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 20% 20%, hsl(200 95% 40% / 0.35), transparent)," +
            "radial-gradient(ellipse 60% 40% at 80% 80%, hsl(216 80% 30% / 0.5), transparent)",
        }}
      />

      {mounted && (
        <div className="absolute right-3 top-3 z-20 flex gap-2 sm:right-5 sm:top-5">
          <LanguageSwitcher tone="light" />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={logo} alt="Car Plus" className="mx-auto mb-4 h-16 w-auto rounded-xl" />
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            <Shield className="h-3.5 w-3.5" />
            {t("admin.login.badge")}
          </div>
          <h1 className="text-2xl font-bold text-white">{t("admin.login.title")}</h1>
          <p className="mt-1 text-sm text-white/50">{t("admin.login.subtitle")}</p>
        </div>

        <form
          onSubmit={handleSignIn}
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-white/80">{t("admin.login.email")}</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@carplus.com"
                value={email}
                onChange={(e) => setEmail(cleanEmail(e.target.value))}
                required
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-[hsl(200_95%_52%)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-white/80">{t("admin.login.password")}</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(cleanPassword(e.target.value))}
                required
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-[hsl(200_95%_52%)]"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("admin.login.loading")}
                </>
              ) : (
                t("admin.login.submit")
              )}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          <Link to="/" className="transition-colors hover:text-white/70">
            {t("admin.login.back")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
