import { Navigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrders } from "@/hooks/useMyOrders";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package } from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

const statusVariant = (s: string): "default" | "secondary" | "outline" | "destructive" =>
  s === "completed" || s === "delivered" ? "default"
    : s === "cancelled" ? "destructive"
    : s === "pending" ? "outline" : "secondary";

const Orders = () => {
  const { user, loading } = useAuth();
  const { data: orders = [], isLoading } = useMyOrders();
  const { t } = useLanguage();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const money = (n: number) => `$${Number(n).toLocaleString()}`;
  const statusLabel = (s: string) => t(`orders.status.${s}` as TranslationKey);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl font-bold sm:text-3xl mb-1">{t("orders.title")}</h1>
          <p className="text-muted-foreground mb-8">{t("orders.subtitle")}</p>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">{t("orders.empty")}</p>
              <Button asChild><Link to="/#inventory">{t("orders.browse")}</Link></Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <Card key={o.id}>
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {o.order_items?.length ? o.order_items.map((i) => i.car_name).join(", ") : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(o.created_at).toLocaleDateString()} · {t("orders.number")} #{o.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{money(o.total_amount)}</span>
                      <Badge variant={statusVariant(o.status)}>{statusLabel(o.status)}</Badge>
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
