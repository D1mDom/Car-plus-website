import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCars, type Car } from './useCars';

interface WishlistItem {
  id: string;
  car_id: string;
  car: Car;
}

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  isInWishlist: (carId: string) => boolean;
  toggleWishlist: (carId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();
  const { data: carsData = [] } = useCars();

  const fetchWishlist = () => {
    if (!user) {
      setItems([]);
      setHydrated(false);
      return;
    }

    setLoading(true);
    try {
      const stored = localStorage.getItem(`wishlist_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hydratedItems = parsed.map((item: any) => {
          const car = carsData.find(c => c.id === item.car_id);
          if (!car) return null;
          return {
            id: item.id,
            car_id: item.car_id,
            car
          };
        }).filter(Boolean);
        setItems(hydratedItems);
      }
    } catch (e) {
      console.error("Local wishlist error:", e);
    }
    setLoading(false);
    // Only allow saving back to storage after the first load has run, so an
    // initial empty state can't overwrite a saved wishlist.
    setHydrated(true);
  };

  useEffect(() => {
    if (carsData.length > 0) {
      fetchWishlist();
    }
  }, [user, carsData]);

  // Save to local storage whenever items change
  useEffect(() => {
    if (user && hydrated) {
      const minimisedItems = items.map(i => ({ id: i.id, car_id: i.car_id }));
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(minimisedItems));
    }
  }, [items, user, hydrated]);

  const isInWishlist = (carId: string) => {
    return items.some(item => item.car_id === carId);
  };

  const toggleWishlist = async (carId: string) => {
    if (!user) {
      toast.error('Please sign in to save to wishlist');
      return;
    }

    const existing = items.find(item => item.car_id === carId);

    if (existing) {
      setItems(prev => prev.filter(item => item.id !== existing.id));
      toast.success('Removed from wishlist');
    } else {
      const car = carsData.find(c => c.id === carId);
      if (car) {
        const newItem = {
          id: Math.random().toString(36).substr(2, 9),
          car_id: carId,
          car
        };
        setItems(prev => [...prev, newItem]);
        toast.success('Added to wishlist');
      }
    }
  };

  return (
    <WishlistContext.Provider value={{ items, loading, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    console.warn("useWishlist used without WishlistProvider");
    return {
      items: [],
      loading: false,
      isInWishlist: () => false,
      toggleWishlist: async () => {},
    };
  }
  return context;
};
