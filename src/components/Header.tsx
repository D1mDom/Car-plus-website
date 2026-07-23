import { Link } from "react-router-dom";
import { Heart, Megaphone, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";
import UserMenu from "@/components/UserMenu";
import { useWishlist } from "@/hooks/useWishlist";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { usePromotion } from "@/hooks/usePromotion";

const Header = () => {
  const { items } = useWishlist();
  const { isAdmin } = useAdmin();
  const { promotionText } = usePromotion();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        {/* Dynamic Global Promotion Banner */}
        {promotionText && (
          <div className="w-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground py-2 px-4 shadow-md flex items-center justify-center animate-fade-in origin-top">
            <Megaphone className="h-4 w-4 mr-2 animate-bounce" />
            <p className="text-sm font-bold tracking-wide text-center">
              {promotionText}
            </p>
            <Megaphone className="h-4 w-4 ml-2 animate-bounce flex-row-reverse" />
          </div>
        )}
        
        <div className="border-b-2 border-border bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Mobile menu */}
                <Sheet>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon" aria-label="បើកម៉ឺនុយ">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72">
                    <nav className="mt-8 flex flex-col gap-1">
                      <SheetClose asChild>
                        <Link to="/" className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent">ទំព័រដើម</Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/#inventory" className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent">ស្តុកឡាន</Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/#about" className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent">អំពីយើង</Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/#contact" className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent">ទំនាក់ទំនង</Link>
                      </SheetClose>
                      {isAdmin && (
                        <SheetClose asChild>
                          <Link to="/admin" className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent">Admin</Link>
                        </SheetClose>
                      )}
                      <a href="https://t.me/Carplus777" target="_blank" rel="noopener noreferrer" className="mt-2 rounded-lg px-3 py-3 text-base font-medium text-primary hover:bg-accent">Telegram @Carplus777</a>
                    </nav>
                  </SheetContent>
                </Sheet>

                <Link to="/" className="flex items-center gap-2">
                  <img src={logo} alt="Car Plus ឡូហ្គោ" className="h-16 w-auto rounded-lg border-2 border-primary/30" />
                </Link>
              </div>

              <nav className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">
                  ទំព័រដើម
                </Link>
                <Link to="/#inventory" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">
                  ស្តុកឡាន
                </Link>
                <Link to="/#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">
                  អំពីយើង
                </Link>
                <Link to="/#contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">
                  ទំនាក់ទំនង
                </Link>
              </nav>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary" asChild>
                  <Link to="/wishlist">
                    <Heart className={`h-5 w-5 ${items.length > 0 ? "fill-primary text-primary" : ""}`} />
                    {items.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                        {items.length}
                      </span>
                    )}
                  </Link>
                </Button>
                <UserMenu />
                <a 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors border-2 border-primary/30 rounded-lg px-3 py-1.5 hover:border-primary" 
                  href="https://t.me/Carplus777"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                  </svg>
                  @Carplus777
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Spacer to prevent content from hiding behind the fixed navbar. Depends on promotion. */}
      <div className={promotionText ? "h-24" : "h-16"} aria-hidden="true" />
    </>
  );
};

export default Header;
