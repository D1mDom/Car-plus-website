import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Car, ExternalLink, CheckCircle2, ArrowRight } from "lucide-react";
import CarFormDialog from "@/components/admin/CarFormDialog";
import type { Car as CarType } from "@/hooks/useCars";
import SafeImg from "@/components/SafeImg";
import { getCarCoverImage } from "@/lib/carUtils";
import { formatCarIdentity } from "@/lib/carCodeUtils";
import type { TranslationKey } from "@/i18n/translations";

const AdminAddCar = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [recentAdds, setRecentAdds] = useState<CarType[]>([]);

  const handleCreated = (car: CarType) => {
    setRecentAdds((prev) => [car, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#174080]/10 text-[#174080]">
            <Car className="h-5 w-5" />
          </span>
          <p className="max-w-xl text-sm text-muted-foreground">{t("admin.addCar.pageHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link to="/admin/cars">
              <ArrowLeft className="h-4 w-4" />
              {t("admin.addCar.backToCars")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href="/cars" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t("admin.addCar.viewListing")}
            </a>
          </Button>
        </div>
      </div>

      <CarFormDialog
        open
        car={null}
        variant="page"
        onCreated={handleCreated}
        onOpenChange={(open) => {
          if (!open) navigate("/admin/cars");
        }}
      />

      {recentAdds.length > 0 ? (
        <Card className="border-emerald-500/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  {t("admin.addCar.recentTitle")}
                </CardTitle>
                <CardDescription className="mt-1">{t("admin.addCar.recentDesc")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <Link to="/admin/cars">
                  {t("admin.addCar.viewAllCars")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentAdds.map((car) => (
                <div
                  key={car.id}
                  className="flex gap-3 rounded-xl border border-border/70 bg-background p-3"
                >
                  <SafeImg
                    src={getCarCoverImage(car)}
                    alt={car.name}
                    className="h-16 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-semibold text-foreground">{car.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{formatCarIdentity(car)}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        ${car.price.toLocaleString()}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {t(`status.${car.status}` as TranslationKey)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default AdminAddCar;
