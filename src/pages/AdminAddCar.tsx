import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CarFormDialog from "@/components/admin/CarFormDialog";

const AdminAddCar = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin.addCar.title")}</h1>
          <p className="text-muted-foreground">{t("admin.addCar.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" className="w-fit gap-1.5" asChild>
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4" />
            {t("admin.nav.cars")}
          </Link>
        </Button>
      </div>

      <CarFormDialog
        open
        car={null}
        variant="page"
        onOpenChange={(open) => {
          if (!open) navigate("/admin");
        }}
      />
    </div>
  );
};

export default AdminAddCar;
