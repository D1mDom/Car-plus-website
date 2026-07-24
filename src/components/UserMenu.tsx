import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

const UserMenu = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (<Button variant="ghost" size="icon" disabled><User className="h-5 w-5" /></Button>);
  }

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          Login
        </Button>
      </Link>
    );
  }

  // Show the display name set at signup; fall back to the email name if none.
  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.display_name as string) ||
    user.email?.split("@")[0] ||
    "";

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground sm:inline">
        {displayName}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={signOut}
        className="gap-2 text-destructive hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </div>
  );
};

export default UserMenu;
