import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Megaphone, Menu, LayoutDashboard } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";
import UserMenu from "@/components/UserMenu";
import { useWishlist } from "@/hooks/useWishlist";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { usePromotion } from "@/hooks/usePromotion";
import { useContact } from "@/hooks/useContact";

const Header = () => {
  const { items } = useWishlist();
  const { isAdmin } = useAdmin();
  const { promotionText } = usePromotion();
  const { data: contact } = useContact();
  const telegramDisplay = contact?.telegram || "@Carplus777";
  const telegramHandle = telegramDisplay.replace(/^@/, "");
  const navigate = useNavigate();
  const location = useLocation();

  // Smooth-scroll to an in-page section. React Router's <Link to="/#id"> does not
  // scroll to the anchor on its own, so we handle it here. If we're on another
  // route first go home, then scroll once the page has rendered.
  const scrollToSection = (id: string) => {
    if (!id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const handleNav = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToSection(id), 120);
    } else {
      scrollToSection(id);
    }
  };

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
                        <Link to="/" onClick={(e) => handleNav(e, "")} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent">ទំព័រដើម</Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/#inventory" onClick={(e) => handleNav(e, "inventory")} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent">ស្តុកឡាន</Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/#about" onClick={(e) => handleNav(e, "about")} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent">អំពីយើង</Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/#contact" onClick={(e) => handleNav(e, "contact")} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent">ទំនាក់ទំនង</Link>
                      </SheetClose>
                      {isAdmin && (
                        <SheetClose asChild>
                          <Link to="/admin" className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent">Admin</Link>
                        </SheetClose>
                      )}
                      <a href={`https://t.me/${telegramHandle}`} target="_blank" rel="noopener noreferrer" className="mt-2 rounded-lg px-3 py-3 text-base font-medium text-primary hover:bg-accent">Telegram {telegramDisplay}</a>
                    </nav>
                  </SheetContent>
                </Sheet>

                <Link to="/" className="flex items-center gap-2">
                  <img src={logo} alt="Car Plus ឡូហ្គោ" className="h-16 w-auto rounded-lg border-2 border-primary/30" />
                </Link>
              </div>

              <nav className="hidden md:flex items-center gap-8">
                <Link to="/" onClick={(e) => handleNav(e, "")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">
                  ទំព័រដើម
                </Link>
                <Link to="/#inventory" onClick={(e) => handleNav(e, "inventory")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">
                  ស្តុកឡាន
                </Link>
                <Link to="/#about" onClick={(e) => handleNav(e, "about")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">
                  អំពីយើង
                </Link>
                <Link to="/#contact" onClick={(e) => handleNav(e, "contact")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">
                  ទំនាក់ទំនង
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">
                    <LayoutDashboard className="h-4 w-4" />
                    ផ្ទាំងគ្រប់គ្រង
                  </Link>
                )}
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
