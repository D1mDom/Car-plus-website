import { useMemo, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useCars } from "@/hooks/useCars";
import { carMatchesCategory } from "@/lib/carUtils";
import { Button } from "@/components/ui/button";
import { Loader2, Sheet, FileText } from "lucide-react";
import { toast } from "sonner";
import AdminStatCards from "@/components/admin/AdminStatCards";
import AdminCarList from "@/components/admin/AdminCarList";
import { exportDashboardExcel, exportDashboardPdf } from "@/lib/dashboardExport";

const Admin = () => {
  const { t } = useLanguage();
  const { data: cars = [] } = useCars();
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const realCars = useMemo(
    () => cars.filter((c) => !String(c.id).startsWith("mock-")),
    [cars],
  );

  const stats = useMemo(
    () => ({
      total: realCars.length,
      ready: realCars.filter((c) => carMatchesCategory(c, "ready")).length,
      luxury: realCars.filter((c) => carMatchesCategory(c, "luxury")).length,
      totalValue: realCars.reduce((sum, c) => sum + c.price, 0),
    }),
    [realCars],
  );

  const exportLabels = useMemo(
    () => ({
      title: t("admin.dashboard.exportTitle"),
      exportedAt: t("admin.dashboard.exportedAt"),
      totalCars: t("admin.cars.total"),
      ready: t("admin.cars.ready"),
      luxury: t("admin.cars.luxury"),
      totalValue: t("admin.cars.value"),
      colCode: t("admin.cars.col.code"),
      colName: t("admin.cars.col.name"),
      colModel: t("form.model"),
      colYear: t("admin.cars.col.year"),
      colPrice: t("admin.cars.col.price"),
      colStatus: t("admin.cars.col.status"),
      colVisible: t("admin.cars.col.visible"),
      yes: t("admin.dashboard.yes"),
      no: t("admin.dashboard.no"),
    }),
    [t],
  );

  const stamp = new Date().toISOString().slice(0, 10);

  const handleExcel = () => {
    if (!realCars.length) {
      toast.error(t("admin.dashboard.exportEmpty"));
      return;
    }
    setExporting("excel");
    try {
      exportDashboardExcel(realCars, `carplus-dashboard-${stamp}.csv`);
      toast.success(t("admin.dashboard.exportExcelDone"));
    } catch (err) {
      toast.error(t("admin.dashboard.exportFail"));
    } finally {
      setExporting(null);
    }
  };

  const handlePdf = async () => {
    if (!realCars.length) {
      toast.error(t("admin.dashboard.exportEmpty"));
      return;
    }
    setExporting("pdf");
    try {
      await exportDashboardPdf(realCars, stats, exportLabels);
      toast.success(t("admin.dashboard.exportPdfDone"));
    } catch {
      toast.error(t("admin.dashboard.exportFail"));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          className="gap-2 transition-transform active:scale-95"
          onClick={handleExcel}
          disabled={!!exporting}
        >
          {exporting === "excel" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sheet className="h-4 w-4 text-emerald-600" />
          )}
          {t("admin.dashboard.exportExcel")}
        </Button>
        <Button
          variant="outline"
          className="gap-2 transition-transform active:scale-95"
          onClick={() => void handlePdf()}
          disabled={!!exporting}
        >
          {exporting === "pdf" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 text-red-600" />
          )}
          {t("admin.dashboard.exportPdf")}
        </Button>
      </div>

      <AdminStatCards />

      <AdminCarList previewLimit={8} />
    </div>
  );
};

export default Admin;
