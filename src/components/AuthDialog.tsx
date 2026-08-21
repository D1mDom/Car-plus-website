import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";
import ForgotPasswordFlow from "@/components/ForgotPasswordFlow";
import { loadRememberedLogin, persistRememberedLogin } from "@/lib/rememberLogin";

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
  onSignupSuccess?: () => void;
};

const AuthDialog = ({
  open,
  onOpenChange,
  onLoginSuccess,
  onSignupSuccess,
}: AuthDialogProps) => {
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showReset, setShowReset] = useState(false);

  const cleanEmail = (v: string) => v.replace(/[^a-zA-Z0-9@._%+-]/g, "");
  const cleanPassword = (v: string) => v.replace(/[^\x20-\x7E]/g, "");
  // Allow Khmer + any language letters (not English-only)
  const cleanName = (v: string) => v.replace(/[^\p{L}\p{M}\s'.\-]/gu, "").slice(0, 120);

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setError("");
    setShowPw(false);
    setLoading(false);
    setTab("signin");
    setShowReset(false);
  };

  useEffect(() => {
    if (!open) return;
    const saved = loadRememberedLogin("website");
    setRememberMe(saved.remember);
    if (saved.email) setEmail(saved.email);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch {
      setError(t("auth.errorInvalid"));
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? t("auth.errorCredentials")
          : err.message
      );
      return;
    }
    persistRememberedLogin("website", email, rememberMe);
    resetForm();
    if (!rememberMe) setEmail("");
    onOpenChange(false);
    onLoginSuccess?.();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!fullName.trim()) throw new Error("name");
      if (password !== confirmPassword) throw new Error("match");
    } catch (err) {
      if (err instanceof Error && err.message === "match") {
        setError(t("auth.errorPasswordMatch"));
        return;
      }
      setError(t("auth.errorInvalid"));
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email, password, fullName);
    setLoading(false);
    if (err) {
      if (err.message.includes("already registered")) {
        setError(t("auth.errorExists"));
        return;
      }
      setError(err.message);
      return;
    }
    persistRememberedLogin("website", email, rememberMe);
    resetForm();
    if (!rememberMe) setEmail("");
    onOpenChange(false);
    onSignupSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto sm:rounded-2xl">
        <DialogHeader className="space-y-3 text-center sm:text-center">
          <img src={logo} alt="Car Plus" className="mx-auto h-12 w-auto rounded-lg" />
          <DialogTitle className="font-heading text-xl">{t("auth.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("auth.dialogSubtitle")}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); setError(""); }} className="w-full">
          <TabsList className={showReset ? "mb-4 hidden" : "mb-4 grid w-full grid-cols-2"}>
            <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
            <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
          </TabsList>

          {error && (
            <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <TabsContent value="signin" className="mt-0">
            {showReset ? (
              <ForgotPasswordFlow
                email={email}
                onBack={() => setShowReset(false)}
                onDone={(newPassword) => {
                  persistRememberedLogin("website", email, rememberMe);
                  setPassword(newPassword);
                  setShowReset(false);
                }}
                idPrefix="auth-dialog"
              />
            ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-dialog-email">{t("auth.email")}</Label>
                <Input
                  id="auth-dialog-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(cleanEmail(e.target.value))}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-dialog-password">{t("auth.password")}</Label>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        emailSchema.parse(email);
                        setError("");
                        setShowReset(true);
                      } catch {
                        setError(t("auth.errorEmailRequired"));
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="auth-dialog-password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(cleanPassword(e.target.value))}
                    required
                    className="pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="auth-dialog-remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                />
                <Label htmlFor="auth-dialog-remember" className="cursor-pointer text-sm font-normal">
                  {t("auth.rememberMe")}
                </Label>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
            </form>
            )}
          </TabsContent>

          <TabsContent value="signup" className="mt-0">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-dialog-name">{t("auth.fullName")}</Label>
                <Input
                  id="auth-dialog-name"
                  type="text"
                  placeholder={t("auth.fullNamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(cleanName(e.target.value))}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-dialog-signup-email">{t("auth.email")}</Label>
                <Input
                  id="auth-dialog-signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(cleanEmail(e.target.value))}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-dialog-signup-password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="auth-dialog-signup-password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(cleanPassword(e.target.value))}
                    required
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-dialog-confirm">{t("auth.confirmPassword")}</Label>
                <Input
                  id="auth-dialog-confirm"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(cleanPassword(e.target.value))}
                  required
                  autoComplete="new-password"
                  className={
                    confirmPassword && confirmPassword !== password
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
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
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
