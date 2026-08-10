import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InventorySection from "@/components/InventorySection";

const Cars = () => {
  const [params] = useSearchParams();
  const search = params.get("q") ?? "";
  const brand = params.get("brand");

  return (
    <div className="min-h-screen overflow-x-hidden bg-background bg-mesh">
      <Header />
      <main className="pt-6 pb-10 sm:pt-8 sm:pb-14">
        <InventorySection initialSearch={search} initialBrand={brand} />
      </main>
      <Footer />
    </div>
  );
};

export default Cars;
