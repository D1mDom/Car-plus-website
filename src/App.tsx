import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { WishlistProvider } from "@/hooks/useWishlist";
import { LanguageProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index";
import Cars from "./pages/Cars";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CarDetail from "./pages/CarDetail";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminAddCar from "./pages/AdminAddCar";
import AdminLogin from "./pages/AdminLogin";
import AdminContact from "./pages/AdminContact";
import AdminOrders from "./pages/AdminOrders";
import AdminReceipts from "./pages/AdminReceipts";
import AdminReports from "./pages/AdminReports";
import AdminBanners from "./pages/AdminBanners";
import AdminTeam from "./pages/AdminTeam";
import AdminBrands from "./pages/AdminBrands";
import AdminSettings from "./pages/AdminSettings";
import AdminGuard from "./components/admin/AdminGuard";
import AdminLayout from "./components/admin/AdminLayout";
import NotFound from "./pages/NotFound";
import VisitorTracker from "./components/VisitorTracker";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" storageKey="carplus-theme" enableSystem>
        <LanguageProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <WishlistProvider>
                  <Toaster />
                  <Sonner />
                  <VisitorTracker />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/cars" element={<Cars />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/car/:id" element={<CarDetail />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/profile" element={<Profile />} />

                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminGuard />}>
                      <Route element={<AdminLayout />}>
                        <Route index element={<Admin />} />
                        <Route path="add-car" element={<AdminAddCar />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="receipts" element={<AdminReceipts />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="contact" element={<AdminContact />} />
                        <Route path="banners" element={<AdminBanners />} />
                        <Route path="brands" element={<AdminBrands />} />
                        <Route path="team" element={<AdminTeam />} />
                        <Route path="settings" element={<AdminSettings />} />
                      </Route>
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </WishlistProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
