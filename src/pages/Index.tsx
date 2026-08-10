import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedCarsSection from "@/components/FeaturedCarsSection";
import PopularBrandsSection from "@/components/PopularBrandsSection";
import LatestListingsSection from "@/components/LatestListingsSection";
import HowItWorksSection from "@/components/HowItWorksSection";

const Index = () => (
  <div className="min-h-screen overflow-x-hidden bg-background bg-mesh">
    <Header />
    <main>
      <HeroSection />
      <FeaturedCarsSection />
      <PopularBrandsSection />
      <LatestListingsSection />
      <HowItWorksSection />
    </main>
    <Footer />
  </div>
);

export default Index;
