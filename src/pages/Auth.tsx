import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import Header from "@/components/Header";
import logo from "@/assets/logo.png";

const emailSchema = z.string().email("អាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវ");
const passwordSchema = z.string().min(6, "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ");

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(email); passwordSchema.parse(password); } catch (err) {
      if (err instanceof z.ZodError) { toast({ title: "កំហុសផ្ទៀងផ្ទាត់", description: err.errors[0].message, variant: "destructive" }); return; }
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { toast({ title: "ចូលមិនបានសម្រេច", description: error.message === "Invalid login credentials" ? "អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ" : error.message, variant: "destructive" }); return; }
    toast({ title: "សូមស្វាគមន៍!", description: "អ្នកបានចូលដោយជោគជ័យ" });
    navigate("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(email); passwordSchema.parse(password); if (!fullName.trim()) throw new Error("ត្រូវការឈ្មោះពេញ"); } catch (err) {
      if (err instanceof z.ZodError) { toast({ title: "កំហុសផ្ទៀងផ្ទាត់", description: err.errors[0].message, variant: "destructive" }); return; }
      if (err instanceof Error) { toast({ title: "កំហុសផ្ទៀងផ្ទាត់", description: err.message, variant: "destructive" }); return; }
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      if (error.message.includes("already registered")) { toast({ title: "គណនីមានរួចហើយ", description: "អ៊ីមែលនេះបានចុះឈ្មោះរួចហើយ។ សូមចូលជំនួសវិញ។", variant: "destructive" }); return; }
      toast({ title: "ចុះឈ្មោះមិនបានសម្រេច", description: error.message, variant: "destructive" }); return;
    }
    toast({ title: "បង្កើតគណនីបានសម្រេច!", description: "ឥឡូវអ្នកអាចចូលគណនីរបស់អ្នកបាន" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-2 border-border">
          <CardHeader className="text-center">
            <img src={logo} alt="Car Plus" className="h-16 w-auto mx-auto mb-4 rounded-lg" />
            <CardTitle className="text-2xl">សូមស្វាគមន៍មក Car Plus</CardTitle>
            <CardDescription>ចូល ឬបង្កើតគណនីដើម្បីបន្ត</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">ចូល</TabsTrigger>
                <TabsTrigger value="signup">ចុះឈ្មោះ</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">អ៊ីមែល</Label>
                    <Input id="signin-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">ពាក្យសម្ងាត់</Label>
                    <Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "កំពុងចូល..." : "ចូល"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">ឈ្មោះពេញ</Label>
                    <Input id="signup-name" type="text" placeholder="ឈ្មោះរបស់អ្នក" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">អ៊ីមែល</Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">ពាក្យសម្ងាត់</Label>
                    <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "កំពុងបង្កើតគណនី..." : "បង្កើតគណនី"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
