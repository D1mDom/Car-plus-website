import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { useCars, type Car } from "@/hooks/useCars";

interface Order { id: string; status: string; total_amount: number; created_at: string; shipping_address: string | null; phone: string | null; }
interface OrderItem { id: string; car_id: string; price: number; }

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending": return "រង់ចាំ";
    case "confirmed": return "បានបញ្ជាក់";
    case "completed": return "បានបញ្ចប់";
    case "cancelled": return "បានលុបចោល";
    default: return status;
  }
};

const Orders = () => {
  const { user } = useAuth();
  const { data: carsData = [] } = useCars();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data: ordersData, error } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) { console.error("Error fetching orders:", error); setLoading(false); return; }
      setOrders(ordersData || []);
      const itemsMap: Record<string, OrderItem[]> = {};
      for (const order of ordersData || []) {
        const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
        itemsMap[order.id] = items || [];
      }
      setOrderItems(itemsMap);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background"><Header />
        <main className="pt-24 pb-16"><div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">សូមចូលគណនីដើម្បីមើលការបញ្ជាទិញ</h1>
          <Link to="/auth"><Button>ចូល</Button></Link>
        </div></main><Footer />
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) { case "pending": return "secondary"; case "confirmed": case "completed": return "default"; case "cancelled": return "destructive"; default: return "secondary"; }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />ត្រឡប់ទៅទិញទំនិញ
          </Link>
          <h1 className="text-3xl font-bold mb-8">ការបញ្ជាទិញរបស់ខ្ញុំ</h1>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-medium mb-2">មិនទាន់មានការបញ្ជាទិញ</h2>
                <p className="text-muted-foreground mb-4">ចាប់ផ្តើមទិញទំនិញដើម្បីមើលការបញ្ជាទិញរបស់អ្នកនៅទីនេះ</p>
                <Link to="/"><Button>មើលឡាន</Button></Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">ការបញ្ជាទិញ #{order.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("km-KH", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(order.status)}>{getStatusLabel(order.status)}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orderItems[order.id]?.map((item) => {
                        const car = carsData.find((c) => c.id === item.car_id);
                        return (
                          <div key={item.id} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                            {car && (<>
                              <img src={car.image} alt={car.name} className="w-20 h-14 object-cover rounded-lg" />
                              <div className="flex-1"><h4 className="font-medium">{car.name}</h4><p className="text-sm text-muted-foreground">{car.code}</p></div>
                            </>)}
                            <p className="font-bold text-primary">${Number(item.price).toLocaleString()}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-border">
                      <span className="font-medium">សរុប</span>
                      <span className="text-xl font-bold text-primary">${Number(order.total_amount).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
