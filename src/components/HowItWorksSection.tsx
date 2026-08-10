import { Search, Phone, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/i18n/translations";

const steps: { icon: typeof Search; title: TranslationKey; desc: TranslationKey }[] = [
  { icon: Search, title: "home.how.browse", desc: "home.how.browseDesc" },
  { icon: Phone, title: "home.how.connect", desc: "home.how.connectDesc" },
  { icon: ShieldCheck, title: "home.how.confidence", desc: "home.how.confidenceDesc" },
];

const HowItWorksSection = () => {
  const { t } = useLanguage();

  return (
    <section className="border-t border-border/60 bg-card py-10 sm:py-14">
      <div className="container mx-auto max-w-7xl px-[10px]">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {t("home.how.eyebrow")}
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("home.how.title")}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-border/70 bg-background p-6 text-center shadow-sm"
            >
              <span className="absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <step.icon className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{t(step.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(step.desc)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
