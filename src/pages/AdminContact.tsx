import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useContact, useUpdateContact, type ContactInfo } from "@/hooks/useContact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

const FIELDS: [keyof ContactInfo, string, string][] = [
  ["phone", "ទូរស័ព្ទ", "+855 12 345 678"],
  ["telegram", "Telegram", "@Carplus777"],
  ["facebook", "Facebook", "https://facebook.com/..."],
  ["address", "អាសយដ្ឋាន", "ភ្នំពេញ, កម្ពុជា"],
  ["email", "អ៊ីមែល", "you@example.com"],
  ["map_link", "Google Maps Link", "https://maps.google.com/..."],
];

const AdminContact = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { data: contact, isLoading } = useContact();
  const updateContact = useUpdateContact();
  const [form, setForm] = useState<ContactInfo | null>(null);

  useEffect(() => {
    if (contact) setForm(contact);
  }, [contact]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
            <Button asChild><Link to="/">Go Home</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form) updateContact.mutate(form);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />ត្រឡប់ទៅ Admin
          </Link>
          <Card>
            <CardHeader><CardTitle>ព័ត៌មានទំនាក់ទំនង</CardTitle></CardHeader>
            <CardContent>
              {isLoading || !form ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {FIELDS.map(([key, label, placeholder]) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={form[key] ?? ""}
                        placeholder={placeholder}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <Button type="submit" className="w-full" disabled={updateContact.isPending}>
                    {updateContact.isPending ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminContact;
