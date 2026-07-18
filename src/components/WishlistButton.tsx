import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps { carId: string; variant?: 'icon' | 'full'; className?: string; }

const WishlistButton = ({ carId, variant = 'icon', className }: WishlistButtonProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(carId);
  const handleClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(carId); };

  if (variant === 'full') {
    return (
      <Button variant={isWishlisted ? "secondary" : "outline"} onClick={handleClick} className={cn("gap-2", className)}>
        <Heart className={cn("h-4 w-4", isWishlisted && "fill-current text-red-500")} />
        {isWishlisted ? 'បានរក្សាទុក' : 'រក្សាទុក'}
      </Button>
    );
  }

  return (
    <Button size="icon" variant="ghost" onClick={handleClick} className={cn("h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background", className)}>
      <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
    </Button>
  );
};

export default WishlistButton;
