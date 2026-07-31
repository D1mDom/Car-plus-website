import { useContact } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";
import { MapPin } from "lucide-react";

const extractSrc = (value: string): string => {
  const match = value.match(/src="([^"]+)"/);
  return match ? match[1] : value.trim();
};

const LocationMap = () => {
  const { data: contact } = useContact();
  const { t } = useLanguage();
  if (!contact?.map_link) return null;

  const src = extractSrc(contact.map_link);

  return (
    <section id="location" className="border-t border-border/60 bg-card py-10 sm:py-14">
      <div className="container mx-auto px-[10px]">
        <div className="mb-5">
          <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{t("location.eyebrow")}</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("location.title")}
          </h2>
          {contact.address && (
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {contact.address}
            </p>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/70 shadow-card">
          <iframe
            src={src}
            title="Car Plus location"
            className="h-[300px] w-full sm:h-[440px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
};

export default LocationMap;
