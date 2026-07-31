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
import CarDetail from "./pages/CarDetail";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminContact from "./pages/AdminContact";
import AdminOrders from "./pages/AdminOrders";
import AdminReports from "./pages/AdminReports";
import AdminBanners from "./pages/AdminBanners";
import AdminTeam from "./pages/AdminTeam";
import AdminGuard from "./components/admin/AdminGuard";
import AdminLayout from "./components/admin/AdminLayout";
import NotFound from "./pages/NotFound";

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
                  <Routes>
                    <Route path="/" element={<Index />} />
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
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="contact" element={<AdminContact />} />
                        <Route path="banners" element={<AdminBanners />} />
                        <Route path="team" element={<AdminTeam />} />
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
