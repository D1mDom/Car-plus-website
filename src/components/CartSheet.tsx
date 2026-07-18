import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CartSheet = () => {
  const { items, removeFromCart, getCartTotal, itemCount, loading } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (<Link to="/auth"><Button variant="outline" size="icon" className="relative"><ShoppingCart className="h-5 w-5" /></Button></Link>);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (<Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">{itemCount}</Badge>)}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            កន្ត្រករបស់អ្នក ({itemCount})
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col h-[calc(100vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32"><p className="text-muted-foreground">កំពុងផ្ទុក...</p></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">កន្ត្រករបស់អ្នកទទេ</p>
              <p className="text-sm text-muted-foreground">បន្ថែមឡានមួយចំនួនដើម្បីចាប់ផ្តើម</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 rounded-lg border border-border bg-surface">
                    <img src={item.car.image} alt={item.car.name} className="w-20 h-16 object-cover rounded-md" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.car.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.car.code}</p>
                      <p className="text-sm font-bold text-primary mt-1">${item.car.price.toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">សរុប</span>
                  <span className="text-xl font-bold text-primary">${getCartTotal().toLocaleString()}</span>
                </div>
                <Link to="/checkout" className="block">
                  <Button className="w-full" size="lg">បន្តទៅបង់ប្រាក់</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
