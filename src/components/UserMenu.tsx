import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, CircleUserRound, LayoutDashboard } from "lucide-react";

const UserMenu = () => {
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useAdmin();

  if (loading) {
    return (<Button variant="ghost" size="icon" disabled><User className="h-5 w-5" /></Button>);
  }

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          ចូល
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"><CircleUserRound className="h-5 w-5" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5"><p className="text-sm font-medium truncate">{user.email}</p></div>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/admin" className="cursor-pointer"><LayoutDashboard className="mr-2 h-4 w-4" />ផ្ទាំងគ្រប់គ្រង</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />ចាកចេញ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
