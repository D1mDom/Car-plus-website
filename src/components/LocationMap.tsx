import { MapPin, Navigation, ExternalLink, CheckCircle2, XCircle, Phone } from "lucide-react";
import { useContact } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

const extractSrc = (value: string): string => {
  const match = value.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : value.trim();
};

const searchMapsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const directionsMapsUrl = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

/** Prefer a real Google Maps open URL for the “Open in Maps” button. */
const resolveOpenMapsUrl = (mapLink: string, address: string): string => {
  const raw = mapLink.trim();
  if (!raw && address) return searchMapsUrl(address);
  if (!raw) return "";

  if (raw.includes("<iframe")) {
    return address ? searchMapsUrl(address) : extractSrc(raw);
  }

  if (/google\.[^/]+\/maps/i.test(raw) && !/\/maps\/embed/i.test(raw)) {
    return raw;
  }

  if (address) return searchMapsUrl(address);
  return raw;
};

const resolveDirectionsUrl = (mapLink: string, address: string): string => {
  if (address) return directionsMapsUrl(address);
  return resolveOpenMapsUrl(mapLink, address);
};

const resolveEmbedSrc = (mapLink: string): string => {
  if (!mapLink.trim()) return "";
  return extractSrc(mapLink);
};

const isCurrentlyOpen = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  if (day === 0 || day === 6) return hour >= 8 && hour < 18;
  return hour >= 8 && hour < 20;
};

const LocationMap = () => {
  const { data: contact } = useContact();
  const { t } = useLanguage();

  const address = contact?.address?.trim() || "";
  const mapLink = contact?.map_link?.trim() || "";
  const embedSrc = resolveEmbedSrc(mapLink);
  const openMapsUrl = resolveOpenMapsUrl(mapLink, address);
  const directionsUrl = resolveDirectionsUrl(mapLink, address);
  const phone = contact?.phone || "+855 12 345 678";
  const isOpen = isCurrentlyOpen();

  if (!embedSrc && !address) return null;

  return (
    <section id="location" className="border-t border-border/60 bg-background py-12 sm:py-16">
      <div className="container mx-auto max-w-7xl px-[10px]">
        <div className="mb-8 max-w-2xl animate-slide-up">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t("location.eyebrow")}
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("location.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("location.body")}
          </p>
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm lg:grid-cols-[minmax(280px,340px)_1fr]">
          {/* Info panel — logic first */}
          <aside className="flex flex-col justify-between gap-6 border-b border-border/70 bg-[linear-gradient(180deg,hsl(216_40%_16%),hsl(210_32%_20%))] p-6 text-white sm:p-7 lg:border-b-0 lg:border-r lg:border-border/20">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15">
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

              <h3 className="font-heading text-lg font-semibold tracking-tight">
                {t("contact.visitTitle")}
              </h3>

              {address ? (
                <p className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-white/75">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5b8fd4]]" />
                  <span>{address}</span>
                </p>
              ) : (
                <p className="mt-3 text-sm text-white/60">{t("contact.mapMissing")}</p>
              )}

              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 text-[hsl(199_95%_68%)]" />
                {phone}
              </a>
            </div>

            <div className="flex flex-col gap-2.5">
              {directionsUrl && (
                <Button
                  asChild
                  size="lg"
                  className="w-full justify-center rounded-full bg-white text-[hsl(216_45%_18%)] hover:bg-white/90"
                >
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                    <Navigation className="mr-1.5 h-4 w-4" />
                    {t("contact.directions")}
                  </a>
                </Button>
              )}
              {openMapsUrl && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full justify-center rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <a href={openMapsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    {t("contact.openMaps")}
                  </a>
                </Button>
              )}
            </div>
          </aside>

          {/* Map */}
          <div className="relative min-h-[280px] bg-muted sm:min-h-[360px] lg:min-h-[440px]">
            {embedSrc ? (
              <iframe
                src={embedSrc}
                title="Car Plus location"
                className="absolute inset-0 h-full w-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MapPin className="h-7 w-7" />
                </div>
                <p className="max-w-sm text-sm text-muted-foreground">{t("contact.mapMissing")}</p>
                {directionsUrl && (
                  <Button asChild variant="outline" className="mt-1 rounded-full">
                    <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                      <Navigation className="mr-1.5 h-4 w-4" />
                      {t("contact.directions")}
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;
