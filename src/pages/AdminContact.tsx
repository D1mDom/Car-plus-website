import { useEffect, useState } from "react";
import { useContact, useUpdateContact, type ContactInfo } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Label is a translation key (or a literal for brand names that never translate).
const FIELDS: [keyof ContactInfo, string, string][] = [
  ["phone", "contact.phone", "+855 12 345 678"],
  ["telegram", "Telegram", "@Carplus777"],
  ["facebook", "Facebook", "https://facebook.com/..."],
  ["address", "contact.address", "Phnom Penh, Cambodia"],
  ["email", "contact.email", "you@example.com"],
  ["map_link", "Google Maps Link", "https://maps.google.com/..."],
];

const AdminContact = () => {
  const { t } = useLanguage();
  const { data: contact, isLoading } = useContact();
  const updateContact = useUpdateContact();
  const [form, setForm] = useState<ContactInfo | null>(null);

  useEffect(() => {
    if (contact) setForm(contact);
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form) updateContact.mutate(form);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.contact.title")}</h1>
        <p className="text-muted-foreground">{t("admin.contact.subtitle")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader>
        <CardContent>
          {isLoading || !form ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {FIELDS.map(([key, label, placeholder]) => (
                <div className="space-y-2" key={key}>
                  <Label htmlFor={key}>{label.includes(".") ? t(label as TranslationKey) : label}</Label>
                  <Input
                    id={key}
                    value={form[key] ?? ""}
                    placeholder={placeholder}
                    onChange={(e) => {
                      const value = key === "phone"
                        ? e.target.value.replace(/[^0-9+\-\s()]/g, "")
                        : e.target.value;
                      setForm({ ...form, [key]: value });
                    }}
                  />
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={updateContact.isPending}>
                {updateContact.isPending ? t("form.saving") : t("form.save")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContact;
