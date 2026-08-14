import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedCarsSection from "@/components/FeaturedCarsSection";
import HomeCarsByCategorySection from "@/components/HomeCarsByCategorySection";
import PopularBrandsSection from "@/components/PopularBrandsSection";
import HowItWorksSection from "@/components/HowItWorksSection";

const Index = () => (
  <div className="min-h-screen overflow-x-hidden bg-background bg-mesh">
    <Header />
    <main>
      <HeroSection />
      <FeaturedCarsSection />
      <HomeCarsByCategorySection />
      <PopularBrandsSection />
      <HowItWorksSection />
    </main>
    <Footer />
  </div>
);

export default Index;
