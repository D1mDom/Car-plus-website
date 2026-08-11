import { useEffect, useState } from "react";
import { useContact, useUpdateContact, type ContactInfo } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Loader2, Mail, MapPin, Phone } from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

const FIELDS: { key: keyof ContactInfo; labelKey: TranslationKey; placeholder: string }[] = [
  { key: "phone", labelKey: "contact.phone", placeholder: "+855 12 345 678" },
  { key: "telegram", labelKey: "admin.contact.telegram", placeholder: "@Carplus777" },
  { key: "facebook", labelKey: "admin.contact.facebook", placeholder: "https://facebook.com/..." },
  { key: "tiktok", labelKey: "admin.contact.tiktok", placeholder: "https://tiktok.com/@..." },
  { key: "address", labelKey: "contact.address", placeholder: "Phnom Penh, Cambodia" },
  { key: "email", labelKey: "contact.email", placeholder: "you@example.com" },
  { key: "map_link", labelKey: "admin.contact.map", placeholder: "https://maps.google.com/..." },
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

  const preview = form;

  return (
    <div className="space-y-5">
      {isLoading || !form ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("admin.contact.formTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {FIELDS.map(({ key, labelKey, placeholder }) => (
                  <div className="space-y-2" key={key}>
                    <Label htmlFor={key}>{t(labelKey)}</Label>
                    <Input
                      id={key}
                      value={form[key] ?? ""}
                      placeholder={placeholder}
                      onChange={(e) => {
                        const value =
                          key === "phone"
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
            </CardContent>
          </Card>

          <Card className="admin-card-hover h-fit border-border/70 shadow-sm lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle className="text-base">{t("admin.contact.previewTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("admin.contact.previewHint")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#174080]/12 text-[#174080]">
                  <Phone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{t("contact.phone")}</div>
                  <div className="font-medium break-all">{preview?.phone || "—"}</div>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("admin.contact.telegram")}: </span>
                  <span className="font-medium break-all">{preview?.telegram || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("admin.contact.facebook")}: </span>
                  <span className="font-medium break-all">{preview?.facebook || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("admin.contact.tiktok")}: </span>
                  <span className="font-medium break-all">{preview?.tiktok || "—"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{t("contact.address")}</div>
                  <div className="font-medium">{preview?.address || "—"}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{t("contact.email")}</div>
                  <div className="font-medium break-all">{preview?.email || "—"}</div>
                </div>
              </div>

              {preview?.map_link ? (
                <Button asChild variant="outline" className="w-full gap-1.5">
                  <a href={preview.map_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    {t("admin.contact.openMap")}
                  </a>
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  {t("admin.contact.openMap")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminContact;
