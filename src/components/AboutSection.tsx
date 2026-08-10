import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Award, Wrench, CreditCard, ArrowRight, MapPin, Calendar, Phone, Send } from "lucide-react";
import { useTeam, stripContactFromImage, type TeamMember } from "@/hooks/useTeam";
import { useLanguage } from "@/hooks/useLanguage";
import { onImgError } from "@/lib/imageFallback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

const featureKeys: { icon: typeof Shield; title: TranslationKey; desc: TranslationKey }[] = [
  { icon: Shield, title: "about.feature.warranty", desc: "about.feature.warrantyDesc" },
  { icon: Award, title: "about.feature.quality", desc: "about.feature.qualityDesc" },
  { icon: Wrench, title: "about.feature.service", desc: "about.feature.serviceDesc" },
  { icon: CreditCard, title: "about.feature.finance", desc: "about.feature.financeDesc" },
];

const AboutSection = () => {
  const { data: teamMembers = [] } = useTeam();
  const { t } = useLanguage();
  const [selected, setSelected] = useState<TeamMember | null>(null);

  const telegramHref = (raw: string) =>
    `https://t.me/${raw.replace(/^@/, "")}`;

  return (
    <div id="about" className="scroll-mt-20">
      <section className="relative overflow-hidden border-b border-border/60 bg-[linear-gradient(165deg,hsl(216_45%_14%)_0%,hsl(210_35%_22%)_48%,hsl(199_55%_28%)_100%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 55% 45% at 85% 15%, hsl(199 100% 55% / 0.28), transparent 60%), radial-gradient(ellipse 40% 50% at 10% 90%, hsl(28 90% 58% / 0.12), transparent 55%)",
          }}
        />
        <div className="container relative mx-auto max-w-7xl px-[10px] py-14 sm:py-20">
          <div className="mx-auto max-w-3xl animate-slide-up text-center sm:text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(199_90%_72%)]">
              {t("about.eyebrow")}
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Car Plus
            </h1>
            <p className="mt-2 font-heading text-lg font-medium text-white/80 sm:text-xl">
              {t("hero.logoTagline")}
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              {t("about.body")}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-[15px]">
              {t("about.mission")}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/15">
                <Calendar className="h-3.5 w-3.5 text-[hsl(28_95%_68%)]" />
                {t("about.founded")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/15">
                <MapPin className="h-3.5 w-3.5 text-[hsl(199_90%_72%)]" />
                {t("about.location")}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-12 sm:py-16">
        <div className="container mx-auto max-w-7xl px-[10px]">
          <div className="mx-auto mb-10 max-w-2xl animate-slide-up text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t("about.valuesEyebrow")}
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("about.valuesTitle")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("about.valuesBody")}
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
            {featureKeys.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  "group bg-card p-6 transition-colors hover:bg-accent/40 sm:p-7",
                  "animate-slide-up"
                )}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-[15px] font-semibold text-foreground">
                  {t(feature.title)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(feature.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {teamMembers.length > 0 && (
        <section className="border-t border-border/60 bg-card py-12 sm:py-16">
          <div className="container mx-auto max-w-7xl px-[10px]">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t("about.teamPrefix")}{" "}
                <span className="text-primary">{t("about.teamHighlight")}</span>
                {t("about.teamSuffix") ? ` ${t("about.teamSuffix")}` : ""}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("about.teamBody")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{t("about.teamTapHint")}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member, index) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelected(member)}
                  className="group animate-slide-up w-full cursor-pointer rounded-2xl text-center outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/40"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="mx-auto mb-4 overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60 transition-shadow group-hover:shadow-md">
                    {member.image ? (
                      <img
                        src={stripContactFromImage(member.image)}
                        alt={member.name}
                        onError={onImgError}
                        className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border/60 bg-background py-12 sm:py-14">
        <div className="container mx-auto max-w-7xl px-[10px]">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-[linear-gradient(120deg,hsl(216_45%_16%),hsl(199_70%_28%))] px-6 py-8 sm:flex-row sm:items-center sm:px-10 sm:py-10">
            <div className="max-w-xl">
              <h2 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
                {t("about.ctaTitle")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75 sm:text-[15px]">
                {t("about.ctaBody")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-white text-[hsl(216_45%_18%)] hover:bg-white/90">
                <Link to="/cars">
                  {t("about.ctaInventory")}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/contact">{t("about.ctaContact")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent
          className={cn(
            "max-h-[92vh] w-[calc(100%-1.5rem)] max-w-2xl gap-0 overflow-hidden p-0 sm:rounded-2xl",
            "[&>button]:right-3 [&>button]:top-3 [&>button]:z-20 [&>button]:rounded-full",
            "[&>button]:bg-background/90 [&>button]:p-2 [&>button]:opacity-100 [&>button]:shadow-sm",
            "[&>button]:ring-1 [&>button]:ring-border"
          )}
        >
          {selected && (
            <div className="max-h-[92vh] overflow-y-auto">
              <div className="grid sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
                <div className="relative bg-muted">
                  {selected.image ? (
                    <img
                      src={stripContactFromImage(selected.image)}
                      alt={selected.name}
                      onError={onImgError}
                      className="aspect-[4/5] h-full max-h-[320px] w-full object-cover sm:max-h-none sm:min-h-[360px]"
                    />
                  ) : (
                    <div className="flex aspect-[4/5] min-h-[240px] w-full items-center justify-center text-5xl font-semibold text-muted-foreground sm:min-h-[360px]">
                      {selected.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex flex-col p-5 sm:p-6">
                  <DialogHeader className="space-y-1.5 pr-8 text-left">
                    <DialogTitle className="font-heading text-2xl font-bold tracking-tight text-foreground">
                      {selected.name}
                    </DialogTitle>
                    <p className="text-sm font-medium text-primary">{selected.role}</p>
                    <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                      {t("about.teamDetailBody")}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-5 space-y-2 rounded-xl border border-border/70 bg-muted/40 p-3">
                    {selected.phone?.trim() ? (
                      <a
                        href={`tel:${selected.phone.replace(/\s+/g, "")}`}
                        className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Phone className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-normal text-muted-foreground">
                            {t("team.form.phone")}
                          </span>
                          <span className="break-all">{selected.phone}</span>
                        </span>
                      </a>
                    ) : (
                      <p className="px-2 py-2 text-xs text-muted-foreground">
                        {t("about.teamNoPhone")}
                      </p>
                    )}

                    {selected.telegram?.trim() ? (
                      <a
                        href={telegramHref(selected.telegram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#229ED9]/12 text-[#229ED9]">
                          <Send className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-normal text-muted-foreground">
                            {t("team.form.telegram")}
                          </span>
                          <span className="break-all">
                            {selected.telegram.startsWith("@")
                              ? selected.telegram
                              : `@${selected.telegram}`}
                          </span>
                        </span>
                      </a>
                    ) : (
                      <p className="px-2 py-2 text-xs text-muted-foreground">
                        {t("about.teamNoTelegram")}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
                    {selected.phone?.trim() && (
                      <Button asChild className="flex-1 gap-2">
                        <a href={`tel:${selected.phone.replace(/\s+/g, "")}`}>
                          <Phone className="h-4 w-4" />
                          {t("about.teamCall")}
                        </a>
                      </Button>
                    )}
                    {selected.telegram?.trim() && (
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1 gap-2 border-[#229ED9]/40 text-[#229ED9] hover:bg-[#229ED9]/10 hover:text-[#229ED9]"
                      >
                        <a
                          href={telegramHref(selected.telegram)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Send className="h-4 w-4" />
                          {t("about.teamMessage")}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AboutSection;
