import { Phone, Mail, Send, MapPin, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import BusinessHours from "./BusinessHours";
import SocialLinks from "./SocialLinks";
import { useContact } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const isCurrentlyOpen = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  if (day === 0 || day === 6) return hour >= 8 && hour < 18;
  return hour >= 8 && hour < 20;
};

const ContactSection = () => {
  const { data: contact } = useContact();
  const { t } = useLanguage();
  const isOpen = isCurrentlyOpen();
  const phone = contact?.phone || "+855 12 345 678";
  const telegramHandle = (contact?.telegram || "@Carplus777").replace(/^@/, "");
  const email = contact?.email?.trim();

  const channels = [
    {
      key: "phone",
      icon: Phone,
      label: t("contact.call"),
      value: phone,
      href: `tel:${phone.replace(/\s+/g, "")}`,
      accent: "bg-primary/10 text-primary",
    },
    {
      key: "telegram",
      icon: Send,
      label: t("contact.telegramAction"),
      value: contact?.telegram || "@Carplus777",
      href: `https://t.me/${telegramHandle}`,
      accent: "bg-[#229ED9]/10 text-[#1a8fc4]",
      external: true,
    },
    ...(email
      ? [
          {
            key: "email",
            icon: Mail,
            label: t("contact.emailAction"),
            value: email,
            href: `mailto:${email}`,
            accent: "bg-[#174080]/14 text-[#174080]",
          },
        ]
      : []),
  ];

  return (
    <div id="contact" className="scroll-mt-20">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-[linear-gradient(165deg,hsl(216_45%_14%)_0%,hsl(210_35%_22%)_48%,hsl(199_55%_28%)_100%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 55% 45% at 85% 15%, hsl(199 100% 55% / 0.28), transparent 60%), radial-gradient(ellipse 40% 50% at 10% 90%, hsl(217 70% 38% / 0.12), transparent 55%)",
          }}
        />
        <div className="container relative mx-auto max-w-7xl px-[10px] py-14 sm:py-16">
          <div className="mx-auto max-w-3xl animate-slide-up text-center sm:mx-0 sm:text-left">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("contact.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              {t("contact.body")}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/15">
              {isOpen ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  {t("contact.open")}
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-rose-300" />
                  {t("contact.closed")}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Channels + hours */}
      <section className="bg-background py-12 sm:py-16">
        <div className="container mx-auto max-w-7xl px-[10px]">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div className="animate-slide-up">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {t("contact.channelsEyebrow")}
              </p>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                {t("contact.reachTitle")}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {t("contact.reachBody")}
              </p>

              <div className="mt-7 divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card">
                {channels.map((channel) => (
                  <a
                    key={channel.key}
                    href={channel.href}
                    target={"external" in channel && channel.external ? "_blank" : undefined}
                    rel={"external" in channel && channel.external ? "noopener noreferrer" : undefined}
                    className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-accent/40 sm:px-5"
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
                        channel.accent
                      )}
                    >
                      <channel.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {channel.label}
                      </p>
                      <p className="mt-0.5 truncate text-[15px] font-semibold text-foreground">
                        {channel.value}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                ))}

                {contact?.address && (
                  <div className="flex items-start gap-4 px-4 py-4 sm:px-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("contact.visitTitle")}
                      </p>
                      <p className="mt-0.5 text-[15px] font-semibold leading-snug text-foreground">
                        {contact.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <SocialLinks />
              </div>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
              <BusinessHours />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactSection;
