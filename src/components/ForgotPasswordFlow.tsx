import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { z } from "zod";

type ForgotPasswordFlowProps = {
  email: string;
  onBack: () => void;
  onDone: (newPassword: string) => void;
  idPrefix: string;
};

const RESEND_SECONDS = 60;
const cleanPassword = (v: string) => v.replace(/[^\x20-\x7E]/g, "");
const isRateLimit = (message: string) => /rate|too many|after/i.test(message);

const ForgotPasswordFlow = ({
  email,
  onBack,
  onDone,
  idPrefix,
}: ForgotPasswordFlowProps) => {
  const { sendPasswordOtp, verifyPasswordOtp, updatePassword, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const validatePassword = () => {
    try {
      z.string().email().parse(email);
    } catch {
      toast({
        title: t("auth.validationError"),
        description: t("auth.errorEmailRequired"),
        variant: "destructive",
      });
      return false;
    }
    try {
      z.string().min(6).parse(password);
    } catch {
      toast({
        title: t("auth.validationError"),
        description: t("auth.errorPasswordMin"),
        variant: "destructive",
      });
      return false;
    }
    if (password !== confirm) {
      toast({
        title: t("auth.validationError"),
        description: t("auth.errorPasswordMatch"),
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const sendCode = async () => {
    if (!validatePassword()) return false;
    setLoading(true);
    const { error } = await sendPasswordOtp(email);
    setLoading(false);
    if (error && isRateLimit(error.message)) {
      toast({
        title: t("auth.resetFailed"),
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    setCooldown(RESEND_SECONDS);
    setOtpSent(true);
    toast({
      title: t("auth.otpSent"),
      description: t("auth.otpSentDesc", { email }),
    });
    return true;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendCode();
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: t("auth.validationError"),
        description: t("auth.otpInvalid"),
        variant: "destructive",
      });
      return;
    }
    if (!validatePassword()) return;

    setLoading(true);
    const { error: otpError } = await verifyPasswordOtp(email, otp);
    if (otpError) {
      setLoading(false);
      toast({
        title: t("auth.resetFailed"),
        description: t("auth.otpInvalid"),
        variant: "destructive",
      });
      return;
    }

    const { error: passwordError } = await updatePassword(password);
    if (passwordError) {
      setLoading(false);
      await signOut();
      toast({
        title: t("auth.resetFailed"),
        description: passwordError.message,
        variant: "destructive",
      });
      return;
    }

    await signOut();
    setLoading(false);
    toast({ title: t("auth.passwordUpdated"), description: t("auth.passwordUpdatedDesc") });
    onDone(password);
  };

  return (
    <form onSubmit={otpSent ? handleConfirmOtp : handleSend} className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("auth.otpIntro")}</p>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-reset-email`}>{t("auth.email")}</Label>
        <Input
          id={`${idPrefix}-reset-email`}
          type="email"
          value={email}
          readOnly
          disabled
          autoComplete="email"
          className="bg-muted"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-new-password`}>{t("auth.newPassword")}</Label>
        <Input
          id={`${idPrefix}-new-password`}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(cleanPassword(e.target.value))}
          required
          disabled={otpSent}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-confirm-password`}>{t("auth.confirmNewPassword")}</Label>
        <Input
          id={`${idPrefix}-confirm-password`}
          type="password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(cleanPassword(e.target.value))}
          required
          disabled={otpSent}
          autoComplete="new-password"
        />
      </div>

      {otpSent && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.enterOtpConfirm", { email })}
          </p>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
              autoComplete="one-time-code"
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
      )}

      {otpSent ? (
        <>
          <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? t("auth.verifyingOtp") : t("auth.confirmOtp")}
          </Button>
          <button
            type="button"
            disabled={loading || cooldown > 0}
            onClick={() => void sendCode()}
            className="w-full text-center text-sm text-primary disabled:text-muted-foreground"
          >
            {cooldown > 0
              ? t("auth.resendOtpIn", { seconds: cooldown })
              : t("auth.resendOtp")}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setOtpSent(false);
              setOtp("");
            }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {t("auth.editPassword")}
          </button>
        </>
      ) : (
        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading ? t("auth.sendingOtp") : t("auth.sendOtp")}
        </Button>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        {t("auth.backToSignIn")}
      </button>
    </form>
  );
};

export default ForgotPasswordFlow;
