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
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, Shield, Sun, Moon } from "lucide-react";
import logo from "@/assets/logo.png";
import loginBg from "@/assets/slides/slide-3-showroom.jpg";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { hasDashboardAccess } from "@/lib/dashboardAccess";

const emailSchema = z.string().email("Invalid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const LoginBackground = () => (
  <div className="pointer-events-none absolute inset-0">
    <img
      src={loginBg}
      alt=""
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover object-center"
    />
    <img
      src={loginBg}
      alt=""
      aria-hidden
      className="absolute inset-0 h-full w-full scale-105 object-cover object-center blur-lg brightness-[0.85] sm:blur-xl"
    />
    <div className="absolute inset-0 bg-[hsl(216_60%_10%/0.45)]" />
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 90% 80% at 50% 40%, hsl(216 60% 10% / 0.15), hsl(216 60% 10% / 0.72))," +
          "linear-gradient(to bottom, hsl(216 60% 10% / 0.2), hsl(216 60% 12% / 0.82))",
      }}
    />
  </div>
);

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    const rpcOk = !adminErr && adminOk === true;
    if (!hasDashboardAccess(signedIn, rpcOk)) {
      await signOut();
      toast({
        title: "No admin access",
        description:
          "This account does not have dashboard permission. Ask the owner to create the account again with Admin role, or confirm email in Supabase.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Welcome!", description: "Signed in to dashboard" });
    navigate("/admin", { replace: true });
  };

  if (authLoading || (user && adminLoading)) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <LoginBackground />
        <Loader2 className="relative z-10 h-8 w-8 animate-spin text-[#174080]" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <LoginBackground />

      {mounted && (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
          <LanguageSwitcher tone="admin" />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? t("theme.light") : t("theme.dark")}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      )}

      <div className="relative z-10 w-full max-w-[420px] animate-admin-page">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white/95 p-2 shadow-lg shadow-black/20 ring-1 ring-white/20">
            <img src={logo} alt="Car Plus" className="h-full w-full object-contain" />
          </div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#174080]/35 bg-[#174080]/12 px-3 py-1 text-xs font-semibold text-[#143871]">
            <Shield className="h-3.5 w-3.5" />
            {t("admin.login.badge")}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
            {t("admin.login.title")}
          </h1>
          <p className="mt-1.5 text-sm text-white/55">{t("admin.login.subtitle")}</p>
        </div>

        <form
          onSubmit={handleSignIn}
          className="rounded-2xl border border-white/15 bg-card/95 p-6 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-8"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium text-foreground">
                {t("admin.login.email")}
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@carplus.com"
                  value={email}
                  onChange={(e) => setEmail(cleanEmail(e.target.value))}
                  required
                  autoComplete="email"
                  className="h-11 border-border/80 bg-background pl-10 focus-visible:ring-[#174080]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium text-foreground">
                {t("admin.login.password")}
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(cleanPassword(e.target.value))}
                  required
                  autoComplete="current-password"
                  className="h-11 border-border/80 bg-background pl-10 pr-10 focus-visible:ring-[#174080]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "h-11 w-full rounded-lg bg-[#174080] text-base font-semibold text-white",
                "shadow-md shadow-[hsl(217_70%_30%/0.35)] hover:bg-[#143871]"
              )}
            >
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

        <p className="mt-7 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/75"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("admin.login.back").replace(/^←\s*/, "")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
