import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { useCars, type Car } from "./useCars";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  car_id: string;
  car: Car;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (carId: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();
  const { data: carsData = [] } = useCars();
  const { toast } = useToast();

  const fetchCartItems = () => {
    if (!user) {
      setItems([]);
      setHydrated(false);
      return;
    }

    setLoading(true);
    try {
      const stored = localStorage.getItem(`cart_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Hydrate local storage IDs with actual car data
        const hydratedItems = parsed.map((item: any) => {
          const car = carsData.find(c => c.id === item.car_id);
          if (!car) return null;
          return {
            id: item.id,
            car_id: item.car_id,
            car,
            quantity: item.quantity
          };
        }).filter(Boolean);

        setItems(hydratedItems);
      }
    } catch (e) {
      console.error("Local cart error:", e);
    }
    setLoading(false);
    // Only persist after the first load, so an empty initial state can't wipe
    // a saved cart.
    setHydrated(true);
  };

  useEffect(() => {
    if (carsData.length > 0) {
      fetchCartItems();
    }
  }, [user, carsData]);

  // Save to local storage whenever items change
  useEffect(() => {
    if (user && hydrated) {
      const minimisedItems = items.map(i => ({ id: i.id, car_id: i.car_id, quantity: i.quantity }));
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(minimisedItems));
    }
  }, [items, user, hydrated]);

  const addToCart = async (carId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    const existing = items.find((item) => item.car_id === carId);
    if (existing) {
      toast({
        title: "Already in cart",
        description: "This car is already in your cart",
      });
      return;
    }

    const car = carsData.find(c => c.id === carId);
    if (!car) return;

    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      car_id: carId,
      car,
      quantity: 1
    };

    setItems(prev => [...prev, newItem]);

    toast({
      title: "Added to cart",
      description: "Car has been added to your cart",
    });
  };

  const removeFromCart = async (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    toast({
      title: "Removed",
      description: "Car removed from your cart"
    });
  };

  const clearCart = async () => {
    setItems([]);
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => total + item.car.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        removeFromCart,
        clearCart,
        getCartTotal,
        itemCount: items.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    console.warn("useCart used without CartProvider");
    return {
      items: [],
      loading: false,
      addToCart: async () => {},
      removeFromCart: async () => {},
      clearCart: async () => {},
      getCartTotal: () => 0,
      itemCount: 0,
    };
  }
  return context;
};
