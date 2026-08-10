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
import { onImgError } from "@/lib/imageFallback";
import { cn } from "@/lib/utils";
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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PlaceOrderDialog from "@/components/PlaceOrderDialog";
import WishlistButton from "@/components/WishlistButton";

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
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);

  const telegram = (contact?.telegram || "@Carplus777").replace(/^@/, "");
  const phone = contact?.phone || "+855 12 345 678";

  useEffect(() => {
    setSelectedImage(0);
  }, [car?.id]);

  if (!car) return null;

  const images = car.images && car.images.length > 0 ? car.images : [car.image];
  const statusKey = `status.${car.status}` as TranslationKey;

  const specs = [
    { icon: CarIcon, label: t("form.bodyType"), value: car.bodyType },
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
                  <img
                    src={images[selectedImage] || car.image}
                    alt={car.name}
                    onError={onImgError}
                    className="h-full w-full object-cover"
                  />
                  <Badge className="absolute left-3 top-3">{t(statusKey)}</Badge>
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
                        <img
                          src={image}
                          alt={`${car.name} ${index + 1}`}
                          onError={onImgError}
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
                  <p className="font-mono text-xs text-muted-foreground">{car.code}</p>
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
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => {
                        if (!user) {
                          toast.error(t("order.loginRequired"));
                          return;
                        }
                        setOrderOpen(true);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {t("card.order")}
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

      <PlaceOrderDialog
        car={orderOpen ? car : null}
        onOpenChange={(o) => {
          if (!o) setOrderOpen(false);
        }}
      />
    </>
  );
};

export default CarDetailDialog;
