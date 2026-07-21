import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { z } from "zod";

const checkoutSchema = z.object({
  phone: z.string().min(6, "ត្រូវការលេខទូរស័ព្ទ"),
  address: z.string().min(5, "ត្រូវការអាសយដ្ឋានដឹកជញ្ជូន"),
  notes: z.string().max(500, "កំណត់ចំណាំត្រូវតិចជាង ៥០០ តួអក្សរ").optional(),
});

const Checkout = () => {
  const { items, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [formData, setFormData] = useState({ phone: "", address: "", notes: "" });

  if (!user) {
    return (
      <div className="min-h-screen bg-background"><Header />
        <main className="pt-24 pb-16"><div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">សូមចូលគណនីដើម្បីបង់ប្រាក់</h1>
          <Link to="/auth"><Button>ចូល</Button></Link>
        </div></main><Footer />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background"><Header />
        <main className="pt-24 pb-16"><div className="container mx-auto px-4 max-w-lg text-center">
          <div className="bg-surface border-2 border-primary/30 rounded-xl p-8">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">ការបញ្ជាទិញបានជោគជ័យ!</h1>
            <p className="text-muted-foreground mb-6">អរគុណសម្រាប់ការបញ្ជាទិញ។ យើងនឹងទាក់ទងអ្នកឆាប់ៗដើម្បីបញ្ជាក់ព័ត៌មានលម្អិត។</p>
            <Link to="/"><Button>បន្តទិញទំនិញ</Button></Link>
          </div>
        </div></main><Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background"><Header />
        <main className="pt-24 pb-16"><div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">កន្ត្រករបស់អ្នកទទេ</h1>
          <Link to="/"><Button>មើលឡាន</Button></Link>
        </div></main><Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { checkoutSchema.parse(formData); } catch (err) {
      if (err instanceof z.ZodError) { toast({ title: "កំហុសផ្ទៀងផ្ទាត់", description: err.errors[0].message, variant: "destructive" }); return; }
    }
    setLoading(true);
    try {
      // Create the order, then its line items (order_items has a FK to orders).
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: getCartTotal(),
          status: "pending",
          shipping_address: formData.address,
          phone: formData.phone,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        car_id: item.car_id,
        price: item.car.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      await clearCart();

      setOrderComplete(true);
      toast({ title: "ការបញ្ជាទិញបានសម្រេច!", description: "យើងនឹងទាក់ទងអ្នកឆាប់ៗដើម្បីបញ្ជាក់ការបញ្ជាទិញ។" });
    } catch (error) {
      console.error("Checkout error:", error);
      toast({ title: "កំហុស", description: "បរាជ័យក្នុងការបញ្ជាទិញ។ សូមព្យាយាមម្តងទៀត។", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />ត្រឡប់ទៅទិញទំនិញ
          </Link>
          <h1 className="text-3xl font-bold mb-8">បង់ប្រាក់</h1>
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>សង្ខេបការបញ្ជាទិញ</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-border pb-4">
                    <img src={item.car.image} alt={item.car.name} className="w-24 h-18 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.car.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.car.code}</p>
                      <p className="font-bold text-primary mt-1">${item.car.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-lg font-medium">សរុប</span>
                  <span className="text-2xl font-bold text-primary">${getCartTotal().toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>ព័ត៌មានទំនាក់ទំនង</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">លេខទូរស័ព្ទ *</Label>
                    <Input id="phone" type="tel" placeholder="+855 12 345 678" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">អាសយដ្ឋានដឹកជញ្ជូន *</Label>
                    <Textarea id="address" placeholder="បញ្ចូលអាសយដ្ឋានពេញរបស់អ្នក" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">កំណត់ចំណាំបន្ថែម (ជាជម្រើស)</Label>
                    <Textarea id="notes" placeholder="សំណើពិសេស ឬកំណត់ចំណាំ" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "កំពុងបញ្ជាទិញ..." : "បញ្ជាទិញ"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    ដោយបញ្ជាទិញ អ្នកយល់ព្រមនឹងលក្ខខណ្ឌរបស់យើង។ យើងនឹងទាក់ទងអ្នកដើម្បីបញ្ជាក់ការបញ្ជាទិញ និងរៀបចំការបង់ប្រាក់។
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
