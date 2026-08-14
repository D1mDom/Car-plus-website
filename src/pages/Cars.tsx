import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InventorySection from "@/components/InventorySection";
import type { CarStatus } from "@/hooks/useCars";

const VALID_CATEGORIES = new Set<string>(["onroad", "ready", "luxury", "plate"]);

const parseCategory = (value: string | null): CarStatus | "all" => {
  if (!value || !VALID_CATEGORIES.has(value)) return "all";
  return value as CarStatus;
};

const Cars = () => {
  const [params] = useSearchParams();
  const search = params.get("q") ?? "";
  const brand = params.get("brand");
  const category = parseCategory(params.get("category"));

  return (
    <div className="min-h-screen overflow-x-hidden bg-background bg-mesh">
      <Header />
      <main className="pt-6 pb-10 sm:pt-8 sm:pb-14">
        <InventorySection initialSearch={search} initialBrand={brand} initialCategory={category} />
      </main>
      <Footer />
    </div>
  );
};

export default Cars;
