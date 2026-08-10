import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AboutSection from "@/components/AboutSection";

const About = () => (
  <div className="min-h-screen overflow-x-hidden bg-background">
    <Header />
    <main>
      <AboutSection />
    </main>
    <Footer />
  </div>
);

export default About;
