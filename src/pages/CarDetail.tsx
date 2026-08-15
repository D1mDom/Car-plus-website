import { useParams, Link } from "react-router-dom";
import { useCarById } from "@/hooks/useCars";
import { useLanguage } from "@/hooks/useLanguage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Phone, MessageCircle, Check, Pin, Calendar, Fuel, Palette, Shield, Car as CarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useContact } from "@/hooks/useContact";
import { onImgError } from "@/lib/imageFallback";
import type { TranslationKey } from "@/i18n/translations";
import SoldOutBadge from "@/components/SoldOutBadge";
import { useIsCarSold } from "@/hooks/useSoldCarIds";

const parseDescriptionItem = (raw: string) => {
  const pinned = /^\s*📌/.test(raw);
  const text = raw.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, "").trim();
  return { text, pinned };
};

const CarDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: car, isLoading } = useCarById(id || "");
  const [selectedImage, setSelectedImage] = useState(0);
  const { data: contact } = useContact();
  const { t } = useLanguage();
  const telegram = (contact?.telegram || "@Carplus777").replace(/^@/, "");
  const shopPhone = contact?.phone || "016 600 090";
  const sold = useIsCarSold(car?.id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">{t("carDetail.notFound")}</h1>
          <Link to="/cars" className="text-primary hover:underline">{t("carDetail.backToList")}</Link>
        </div>
      </div>
    );
  }

  const specs = [
    { icon: CarIcon, label: t("carDetail.bodyType"), value: car.bodyType },
    { icon: Calendar, label: t("carDetail.year"), value: car.year.toString() },
    { icon: Shield, label: t("carDetail.taxStatus"), value: car.taxStatus },
    { icon: Check, label: t("carDetail.condition"), value: car.condition },
    { icon: Fuel, label: t("carDetail.fuelType"), value: car.fuelType },
    { icon: Palette, label: t("carDetail.color"), value: car.color },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-16 pt-24">
        <div className="container mx-auto px-4">
          <Link to="/cars" className="mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t("carDetail.backToList")}
          </Link>

          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface">
                <img
                  src={(car.images ?? [])[selectedImage] || car.image}
                  onError={onImgError}
                  alt={car.name}
                  className={`h-full w-full object-cover${sold ? " grayscale" : ""}`}
                />
                {sold ? (
                  <>
                    <div className="absolute inset-0 z-[8] bg-black/45" />
                    <SoldOutBadge className="absolute left-1/2 top-1/2 z-[9] -translate-x-1/2 -translate-y-1/2 -rotate-12" />
                  </>
                ) : (
                  <Badge variant={car.status} className="absolute left-4 top-4">
                    {t(`status.${car.status}` as TranslationKey)}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(car.images ?? []).map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all ${selectedImage === index ? "border-primary" : "border-transparent hover:border-border"}`}
                  >
                    <img src={image} alt={car.name} onError={onImgError} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <p className="mb-2 font-mono text-sm text-muted-foreground">
                  {t("carDetail.unitNumber")}: {car.code}
                </p>
                <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">{car.name}</h1>
                {sold ? (
                  <p className="mb-3 inline-flex rounded-full bg-red-600 px-3 py-1 text-sm font-bold uppercase tracking-wide text-white">
                    {t("card.soldOut")}
                  </p>
                ) : null}
                <p className="text-4xl font-bold text-gradient-ocean">${car.price.toLocaleString()}</p>
                {sold ? (
                  <p className="mt-2 text-sm text-red-700">{t("card.soldOutHint")}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="flex-1 gap-2" asChild>
                  <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5" />
                    {t("carDetail.contactTelegram")}
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="flex-1 gap-2" asChild>
                  <a href={`tel:${shopPhone.replace(/\s+/g, "")}`}>
                    <Phone className="h-5 w-5" />
                    {shopPhone}
                  </a>
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">{t("carDetail.includes")}</h2>
                  <ul className="space-y-3">
                    {car.description.map((raw, index) => {
                      const { text, pinned } = parseDescriptionItem(raw);
                      const Icon = pinned ? Pin : Check;
                      return (
                        <li key={index} className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${pinned ? "bg-accent" : "bg-primary/10"}`}>
                            <Icon className={`h-3 w-3 ${pinned ? "text-accent-foreground" : "text-primary"}`} />
                          </div>
                          <span className={pinned ? "font-medium text-foreground" : "text-muted-foreground"}>{text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">{t("carDetail.specs")}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {specs.map((spec) => (
                      <div key={spec.label} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
                          <spec.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{spec.label}</p>
                          <p className="text-sm font-medium text-foreground">{spec.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">{t("carDetail.contact")}</h2>
                  <p className="mb-6 text-muted-foreground">{t("carDetail.contactBody")}</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" className="flex-1 gap-2" asChild>
                      <a href={`tel:${shopPhone.replace(/\s+/g, "")}`}>
                        <Phone className="h-4 w-4" />
                        {t("carDetail.contactPhone")}
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" asChild>
                      <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" />
                        {t("carDetail.contactTelegram")}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarDetail;
