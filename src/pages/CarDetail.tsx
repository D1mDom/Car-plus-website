import { useParams, Link } from "react-router-dom";
import { useCarById, getStatusLabel } from "@/hooks/useCars";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Phone, MessageCircle, Check, Calendar, Fuel, Palette, Shield, Car as CarIcon, ShoppingCart, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";

const CarDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: car, isLoading } = useCarById(id || "");
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart, items } = useCart();
  const isInCart = items.some((item) => item.car_id === id);

  if (isLoading) {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">រកមិនឃើញឡាន</h1>
          <Link to="/" className="text-primary hover:underline">ត្រឡប់ទៅទំព័រដើម</Link>
        </div>
      </div>
    );
  }

  const specs = [
    { icon: CarIcon, label: "ប្រភេទតួ", value: car.bodyType },
    { icon: Calendar, label: "ឆ្នាំ", value: car.year.toString() },
    { icon: Shield, label: "ស្ថានភាពពន្ធ", value: car.taxStatus },
    { icon: Check, label: "លក្ខខណ្ឌ", value: car.condition },
    { icon: Fuel, label: "ប្រភេទប្រេង", value: car.fuelType },
    { icon: Palette, label: "ពណ៌", value: car.color },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            ត្រឡប់ទៅបញ្ជីឡាន
          </Link>

          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface">
                <img src={car.images[selectedImage] || car.image} alt={car.name} className="h-full w-full object-cover" />
                <Badge variant={car.status} className="absolute top-4 left-4">{getStatusLabel(car.status)}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {car.images.map((image, index) => (
                  <button key={index} onClick={() => setSelectedImage(index)} className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? "border-primary" : "border-transparent hover:border-border"}`}>
                    <img src={image} alt={`${car.name} រូប ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-sm text-muted-foreground font-mono mb-2">{car.code}</p>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{car.name}</h1>
                <p className="text-4xl font-bold text-gradient-ocean">${car.price.toLocaleString()}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="flex-1 gap-2" onClick={() => addToCart(car.id)} disabled={isInCart}>
                  <ShoppingCart className="h-5 w-5" />
                  {isInCart ? "ក្នុងកន្ត្រក" : "ដាក់ក្នុងកន្ត្រក"}
                </Button>
                <Button size="lg" variant="ocean" className="flex-1 gap-2" asChild>
                  <Link to={isInCart ? "/checkout" : "#"} onClick={() => !isInCart && addToCart(car.id)}>
                    ទិញឥឡូវ
                  </Link>
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4 text-foreground">អ្វីដែលរួមបញ្ចូល</h2>
                  <ul className="space-y-3">
                    {car.description.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 mt-0.5"><Check className="h-3 w-3 text-primary" /></div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4 text-foreground">លក្ខណៈបច្ចេកទេស</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {specs.map((spec) => (
                      <div key={spec.label} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface"><spec.icon className="h-5 w-5 text-muted-foreground" /></div>
                        <div>
                          <p className="text-xs text-muted-foreground">{spec.label}</p>
                          <p className="text-sm font-medium text-foreground">{spec.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4 text-foreground">ទំនាក់ទំនងយើង</h2>
                  <p className="text-muted-foreground mb-6">ចាប់អារម្មណ៍លើរថយន្តនេះ? ទាក់ទងមកយើងដើម្បីណាត់ជួបសាកឡាន ឬទទួលព័ត៌មានបន្ថែម។</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="flex-1 gap-2" asChild>
                      <a href="tel:+85512345678"><Phone className="h-4 w-4" />ទូរស័ព្ទ</a>
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" asChild>
                      <a href="https://t.me/DomCarStore" target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />តេឡេក្រាម</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarDetail;
