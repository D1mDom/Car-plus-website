import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

/** Protects all /admin/* routes except /admin/login. */
const AdminGuard = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  if (authLoading || (user && adminLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(216_60%_10%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(200_95%_52%)]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[hsl(216_60%_10%)] px-4 text-center">
        <h1 className="text-2xl font-bold text-white">{t("guard.denied")}</h1>
        <p className="max-w-sm text-sm text-white/60">
          {t("guard.deniedBody")}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link to="/">{t("guard.goSite")}</Link>
          </Button>
          <Button
            onClick={async () => {
              await signOut();
            }}
          >
            {t("auth.logout")}
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminGuard;
