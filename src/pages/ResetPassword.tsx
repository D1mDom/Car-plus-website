import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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

const passwordSchema = z.string().min(6, "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ");

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  // Whether the recovery session from the email link is present yet.
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const cleanPassword = (v: string) => v.replace(/[^\x20-\x7E]/g, "");

  // Supabase parses the recovery token from the email link and sets a temporary
  // session. Wait for it before letting the user set a new password.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
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
    try { passwordSchema.parse(password); } catch (err) {
      if (err instanceof z.ZodError) { toast({ title: "កំហុសផ្ទៀងផ្ទាត់", description: err.errors[0].message, variant: "destructive" }); return; }
    }
    if (password !== confirm) {
      toast({ title: "កំហុសផ្ទៀងផ្ទាត់", description: "ពាក្យសម្ងាត់មិនត្រូវគ្នា", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) { toast({ title: "Reset failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Password updated", description: "Please log in with your new password." });
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-2 border-border">
          <CardHeader className="text-center">
            <img src={logo} alt="Car Plus" className="h-16 w-auto mx-auto mb-4 rounded-lg" />
            <CardTitle className="text-2xl">កំណត់ពាក្យសម្ងាត់ឡើងវិញ</CardTitle>
            <CardDescription>បញ្ចូលពាក្យសម្ងាត់ថ្មីរបស់អ្នក</CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : ready ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">ពាក្យសម្ងាត់ថ្មី</Label>
                  <Input id="new-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(cleanPassword(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">បញ្ជាក់ពាក្យសម្ងាត់</Label>
                  <Input id="confirm-password" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(cleanPassword(e.target.value))} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "កំពុងរក្សាទុក..." : "រក្សាទុកពាក្យសម្ងាត់"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  តំណភ្ជាប់នេះមិនត្រឹមត្រូវ ឬផុតកំណត់។ សូមស្នើសុំតំណភ្ជាប់កំណត់ពាក្យសម្ងាត់ថ្មី។
                </p>
                <Button onClick={() => navigate("/auth")} className="w-full">ត្រឡប់ទៅការចូល</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ResetPassword;
