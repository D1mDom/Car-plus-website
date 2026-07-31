import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/i18n/translations";

const faqKeys: { q: TranslationKey; a: TranslationKey }[] = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "faq.a3" },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" },
  { q: "faq.q6", a: "faq.a6" },
];

const FAQSection = () => {
  const { t } = useLanguage();

  return (
    <div>
      <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">
        {t("faq.title")}
      </h3>
      <Accordion type="single" collapsible className="w-full">
        {faqKeys.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-border/70">
            <AccordionTrigger className="text-left text-sm font-medium hover:text-primary hover:no-underline">
              {t(faq.q)}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {t(faq.a)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQSection;
