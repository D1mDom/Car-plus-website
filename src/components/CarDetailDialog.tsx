import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Car } from "@/hooks/useCars";
import { useContact } from "@/hooks/useContact";
import { useLanguage } from "@/hooks/useLanguage";
import { getCarGallery } from "@/lib/carUtils";
import SafeImg from "@/components/SafeImg";
import { cn } from "@/lib/utils";
import { formatCarIdentity } from "@/lib/carCodeUtils";
import { bodyTypeLabel } from "@/components/CategoryFilter";
import type { TranslationKey } from "@/i18n/translations";
import {
  Calendar,
  Fuel,
  Car as CarIcon,
  Palette,
  Shield,
  Check,
  Pin,
  MessageCircle,
  Phone,
  ShoppingCart,
  ExternalLink,
  MapPin,
} from "lucide-react";
import OrderAuthPrompt from "@/components/OrderAuthPrompt";
import WishlistButton from "@/components/WishlistButton";
import SoldOutBadge from "@/components/SoldOutBadge";
import { useIsCarSold } from "@/hooks/useSoldCarIds";

const parseDescriptionItem = (raw: string) => {
  const pinned = /^\s*📌/.test(raw);
  const text = raw.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, "").trim();
  return { text, pinned };
};

interface CarDetailDialogProps {
  car: Car | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CarDetailDialog = ({ car, open, onOpenChange }: CarDetailDialogProps) => {
  const { t } = useLanguage();
  const { data: contact } = useContact();
  const [selectedImage, setSelectedImage] = useState(0);
  const [orderRequested, setOrderRequested] = useState(false);
  const sold = useIsCarSold(car?.id, car?.isSold);

  const telegram = (contact?.telegram || "@Carplus777").replace(/^@/, "");
  const phone = contact?.phone || "+855 12 345 678";

  useEffect(() => {
    setSelectedImage(0);
  }, [car?.id]);

  if (!car) return null;

  const images = getCarGallery(car);
  const statusKey = `status.${car.status}` as TranslationKey;

  const specs = [
    { icon: CarIcon, label: t("form.bodyType"), value: bodyTypeLabel(car.bodyType, t) },
    { icon: Calendar, label: t("form.year"), value: String(car.year) },
    { icon: Shield, label: t("form.taxStatus"), value: car.taxStatus },
    { icon: Check, label: t("form.condition"), value: car.condition },
    { icon: Fuel, label: t("form.fuelType"), value: car.fuelType },
    { icon: Palette, label: t("form.color"), value: car.color },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <div className="max-h-[92vh] overflow-y-auto">
            <div className="grid md:grid-cols-2">
              {/* Gallery */}
              <div className="space-y-3 bg-muted/30 p-4 sm:p-5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  <SafeImg
                    src={images[selectedImage]}
                    alt={car.name}
                    className={cn("h-full w-full object-cover", sold && "grayscale")}
                  />
                  {sold ? (
                    <>
                      <div className="absolute inset-0 z-[8] bg-black/45" />
                      <SoldOutBadge className="absolute left-1/2 top-1/2 z-[9] -translate-x-1/2 -translate-y-1/2 -rotate-12" />
                    </>
                  ) : (
                    <Badge className="absolute left-3 top-3">{t(statusKey)}</Badge>
                  )}
                  <div className="absolute right-3 top-3">
                    <WishlistButton carId={car.id} />
                  </div>
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedImage(index)}
                        className={cn(
                          "aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all",
                          selectedImage === index
                            ? "border-primary"
                            : "border-transparent hover:border-border"
                        )}
                      >
                        <SafeImg
                          src={image}
                          alt={`${car.name} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col p-4 sm:p-6">
                <DialogHeader className="space-y-2 text-left">
                  <p className="font-mono text-xs text-muted-foreground">{formatCarIdentity(car)}</p>
                  <DialogTitle className="font-heading text-xl leading-snug sm:text-2xl">
                    {car.name}
                  </DialogTitle>
                </DialogHeader>

                <p className="mt-3 font-heading text-3xl font-bold text-primary">
                  ${car.price.toLocaleString()}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {t("card.location")}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {specs.map((spec) => (
                    <div key={spec.label} className="flex items-center gap-2.5 rounded-xl bg-muted/50 p-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                        <spec.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">{spec.label}</p>
                        <p className="truncate text-sm font-medium text-foreground">{spec.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {car.description.length > 0 && (
                  <div className="mt-5">
                    <h3 className="mb-2 text-sm font-semibold text-foreground">
                      {t("detail.includes")}
                    </h3>
                    <ul className="max-h-36 space-y-2 overflow-y-auto pr-1">
                      {car.description.map((raw, index) => {
                        const { text, pinned } = parseDescriptionItem(raw);
                        if (!text) return null;
                        const Icon = pinned ? Pin : Check;
                        return (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Icon
                              className={cn(
                                "mt-0.5 h-3.5 w-3.5 shrink-0",
                                pinned ? "text-amber-500" : "text-primary"
                              )}
                            />
                            <span className={pinned ? "font-medium text-foreground" : "text-muted-foreground"}>
                              {text}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="mt-auto space-y-2 pt-6">
                  {sold ? (
                    <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2 text-sm text-red-700">
                      {t("card.soldOutHint")}
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex-1 gap-2"
                      disabled={sold}
                      onClick={() => setOrderRequested(true)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {sold ? t("card.soldOut") : t("card.order")}
                    </Button>
                    <Button asChild variant="outline" className="flex-1 gap-2">
                      <a
                        href={`https://t.me/${telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {t("card.contact")}
                      </a>
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild variant="outline" size="sm" className="flex-1 gap-2">
                      <a href={`tel:${phone.replace(/\s/g, "")}`}>
                        <Phone className="h-4 w-4" />
                        {t("contact.phone")}
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="flex-1 gap-2">
                      <Link to={`/car/${car.id}`} onClick={() => onOpenChange(false)}>
                        <ExternalLink className="h-4 w-4" />
                        {t("detail.fullPage")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OrderAuthPrompt
        car={orderRequested && car ? car : null}
        onOpenChange={(o) => {
          if (!o) setOrderRequested(false);
        }}
      />
    </>
  );
};

export default CarDetailDialog;
