import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import Header from "@/components/Header";
import logo from "@/assets/logo.png";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";

const REMEMBER_EMAIL_KEY = "carplus-remember-email";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successKind, setSuccessKind] = useState<"login" | "signup">("login");
  const [rememberEmail, setRememberEmail] = useState(true);
  const { signIn, signUp, resetPassword, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberEmail(true);
      }
    } catch { /* ignore */ }
  }, []);

  const cleanEmail = (v: string) => v.replace(/[^a-zA-Z0-9@._%+-]/g, "");
  const cleanPassword = (v: string) => v.replace(/[^\x20-\x7E]/g, "");
  const cleanName = (v: string) => v.replace(/[^\p{L}\p{M}\s'.\-]/gu, "").slice(0, 120);

  const emailSchema = z.string().email(t("auth.errorEmailInvalid"));
  const passwordSchema = z.string().min(6, t("auth.errorPasswordMin"));

  useEffect(() => {
    if (user && !successOpen) navigate("/");
  }, [user, navigate, successOpen]);

  const persistEmail = (value: string) => {
    try {
      if (rememberEmail) localStorage.setItem(REMEMBER_EMAIL_KEY, value);
      else localStorage.removeItem(REMEMBER_EMAIL_KEY);
    } catch { /* ignore */ }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: t("auth.validationError"), description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({
        title: t("auth.loginFailed"),
        description:
          error.message === "Invalid login credentials"
            ? t("auth.errorCredentials")
            : error.message,
        variant: "destructive",
      });
      return;
    }
    persistEmail(email);
    setSuccessKind("login");
    setSuccessOpen(true);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!fullName.trim()) throw new Error(t("auth.nameRequired"));
      if (password !== confirmPassword) throw new Error(t("auth.errorPasswordMatch"));
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: t("auth.validationError"), description: err.errors[0].message, variant: "destructive" });
        return;
      }
      if (err instanceof Error) {
        toast({ title: t("auth.validationError"), description: err.message, variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: t("auth.accountExistsTitle"),
          description: t("auth.errorExists"),
          variant: "destructive",
        });
        return;
      }
      toast({ title: t("auth.signupFailed"), description: error.message, variant: "destructive" });
      return;
    }
    persistEmail(email);
    setConfirmPassword("");
    setSuccessKind("signup");
    setSuccessOpen(true);
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: t("auth.validationError"), description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast({ title: t("auth.resetFailed"), description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: t("auth.resetEmailSent"),
      description: t("auth.resetEmailSentDesc", { email }),
    });
    setShowReset(false);
  };

  const closeSuccess = () => {
    setSuccessOpen(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex items-center justify-center px-4 pb-16 pt-24">
        <Card className="w-full max-w-md border-2 border-border">
          <CardHeader className="text-center">
            <img src={logo} alt="Car Plus" className="mx-auto mb-4 h-16 w-auto rounded-lg" />
            <CardTitle className="text-2xl">{t("auth.dialogTitle")}</CardTitle>
            <CardDescription>{t("auth.dialogSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
                <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                {showReset ? (
                  <form onSubmit={handleResetRequest} className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t("auth.resetIntro")}</p>
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">{t("auth.email")}</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(cleanEmail(e.target.value))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t("auth.sendingReset") : t("auth.sendResetLink")}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowReset(false)}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      {t("auth.backToSignIn")}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">{t("auth.email")}</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(cleanEmail(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">{t("auth.password")}</Label>
                        <button
                          type="button"
                          onClick={() => setShowReset(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          {t("auth.forgotPassword")}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPw ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(cleanPassword(e.target.value))}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          tabIndex={-1}
                          aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember-email"
                        checked={rememberEmail}
                        onCheckedChange={(v) => setRememberEmail(v === true)}
                      />
                      <Label htmlFor="remember-email" className="cursor-pointer text-sm font-normal">
                        {t("auth.rememberMe")}
                      </Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t("auth.signingIn") : t("auth.signIn")}
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t("auth.fullName")}</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder={t("auth.fullNamePlaceholder")}
                      value={fullName}
                      onChange={(e) => setFullName(cleanName(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t("auth.email")}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(cleanEmail(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(cleanPassword(e.target.value))}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        tabIndex={-1}
                        aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">{t("auth.confirmPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPw ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(cleanPassword(e.target.value))}
                        required
                        className={`pr-10 ${
                          confirmPassword && confirmPassword !== password
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw((v) => !v)}
                        tabIndex={-1}
                        aria-label={showConfirmPw ? t("auth.hidePassword") : t("auth.showPassword")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-xs text-destructive">{t("auth.errorPasswordMatch")}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t("auth.creating") : t("auth.createAccount")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={successOpen}
        onOpenChange={(o) => {
          if (!o) closeSuccess();
        }}
      >
        <DialogContent className="max-w-sm sm:rounded-2xl">
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <DialogHeader className="space-y-2 text-center sm:text-center">
              <DialogTitle className="font-heading text-xl">
                {successKind === "login" ? t("auth.loginSuccessTitle") : t("auth.signupSuccessTitle")}
              </DialogTitle>
              <DialogDescription>
                {successKind === "login" ? t("auth.loginSuccessBody") : t("auth.signupSuccessBody")}
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-1 w-full" onClick={closeSuccess}>
              {t("auth.ok")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
