import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";
import LocationMap from "@/components/LocationMap";
import FAQSection from "@/components/FAQSection";
import { useLanguage } from "@/hooks/useLanguage";

const Contact = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Header />
      <main>
        <ContactSection />
        <LocationMap />
        <section className="border-t border-border/60 bg-card py-12 sm:py-16">
          <div className="container mx-auto max-w-3xl px-[10px]">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {t("contact.faqEyebrow")}
              </p>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t("faq.title")}
              </h2>
            </div>
            <FAQSection hideTitle />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
