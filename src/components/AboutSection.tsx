import { Shield, Award, Wrench, CreditCard } from "lucide-react";
import BusinessHours from "./BusinessHours";
import SocialLinks from "./SocialLinks";
import FAQSection from "./FAQSection";
import { useTeam } from "@/hooks/useTeam";
import { useLanguage } from "@/hooks/useLanguage";
import { onImgError } from "@/lib/imageFallback";
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

  return (
    <>
      <section id="about" className="scroll-mt-20 border-t border-border/60 bg-card py-10 sm:py-14">
        <div className="container mx-auto px-[10px]">
          <div className="mx-auto mb-7 max-w-2xl text-center sm:mb-8">
            <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{t("about.eyebrow")}</p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("about.title")}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("about.body")}
            </p>
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:mb-10 lg:grid-cols-4 lg:gap-4">
            {featureKeys.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-3 rounded-xl border border-border/70 bg-background p-[10px] transition-colors hover:border-primary/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-semibold text-foreground">{t(feature.title)}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">{t(feature.desc)}</p>
                </div>
              </div>
            ))}
          </div>

          {teamMembers.length > 0 && (
            <div>
              <h3 className="mb-4 text-center font-heading text-xl font-bold text-foreground sm:text-2xl">
                {t("about.teamPrefix")}{" "}
                <span className="text-primary">{t("about.teamHighlight")}</span>
                {t("about.teamSuffix") ? ` ${t("about.teamSuffix")}` : ""}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-[10px] transition-colors hover:border-primary/35"
                  >
                    {member.image ? (
                      <img src={member.image} alt={member.name} onError={onImgError} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-base font-semibold text-muted-foreground">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-foreground">{member.name}</h4>
                      <p className="truncate text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 bg-mesh py-10 sm:py-14">
        <div className="container mx-auto px-[10px]">
          <div className="mx-auto mb-7 max-w-2xl text-center sm:mb-8">
            <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{t("contact.eyebrow")}</p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("contact.title")}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("contact.body")}
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-card p-[10px] shadow-sm sm:p-5">
                <BusinessHours />
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-[10px] shadow-sm sm:p-5">
                <SocialLinks />
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-[10px] shadow-sm sm:p-5">
              <FAQSection />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutSection;
