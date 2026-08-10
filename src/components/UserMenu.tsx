import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AuthDialog from "@/components/AuthDialog";
import { onImgError } from "@/lib/imageFallback";
import { User, LogOut, Package, Heart, UserCircle, CheckCircle2 } from "lucide-react";

const UserMenu = ({
  signInClassName,
  signInLabel,
}: {
  signInClassName?: string;
  signInLabel?: string;
}) => {
  const { user, signOut, loading } = useAuth();
  const { data: profile } = useProfile();
  const { t } = useLanguage();
  const loginText = signInLabel ?? t("auth.login");
  const [authOpen, setAuthOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutSuccessOpen, setLogoutSuccessOpen] = useState(false);
  const [loginSuccessOpen, setLoginSuccessOpen] = useState(false);
  const [signupSuccessOpen, setSignupSuccessOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    setLogoutConfirmOpen(false);
    setLogoutSuccessOpen(true);
  };

  const successDialog = (
    open: boolean,
    onOpenChange: (o: boolean) => void,
    title: string,
    body: string
  ) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:rounded-2xl">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="font-heading text-xl">{title}</DialogTitle>
            <DialogDescription>{body}</DialogDescription>
          </DialogHeader>
          <Button className="mt-1 w-full" onClick={() => onOpenChange(false)}>
            {t("auth.ok")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const avatarUrl =
    profile?.avatar_url ||
    (typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "") ||
    "";

  const displayName =
    profile?.full_name?.trim() ||
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    (typeof user?.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "") ||
    user?.email ||
    "";

  return (
    <>
      {loading ? (
        <Button variant="ghost" size="icon" disabled>
          <User className="h-5 w-5" />
        </Button>
      ) : !user ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={signInClassName ?? "gap-2"}
          onClick={() => setAuthOpen(true)}
        >
          <User className="h-4 w-4" />
          {loginText}
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="max-w-[200px] gap-2 hover:border-[hsl(28_90%_58%/0.45)] hover:bg-[hsl(28_95%_62%/0.14)] hover:text-[hsl(24_80%_42%)] data-[state=open]:border-[hsl(28_90%_58%/0.55)] data-[state=open]:bg-[hsl(28_95%_62%/0.16)] data-[state=open]:text-[hsl(24_80%_42%)]"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  onError={onImgError}
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-4 w-4 shrink-0" />
              )}
              <span className="hidden truncate sm:inline">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer gap-2">
                <User className="h-4 w-4" />
                {t("nav.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/orders" className="cursor-pointer gap-2">
                <Package className="h-4 w-4" />
                {t("nav.orders")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/wishlist" className="cursor-pointer gap-2">
                <Heart className="h-4 w-4" />
                {t("nav.wishlist")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setLogoutConfirmOpen(true);
              }}
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onLoginSuccess={() => setLoginSuccessOpen(true)}
        onSignupSuccess={() => setSignupSuccessOpen(true)}
      />

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent className="sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auth.logoutTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("auth.logoutDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>{t("auth.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleLogout();
              }}
              disabled={loggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loggingOut ? t("auth.loggingOut") : t("auth.logoutConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {successDialog(
        loginSuccessOpen,
        setLoginSuccessOpen,
        t("auth.loginSuccessTitle"),
        t("auth.loginSuccessBody")
      )}
      {successDialog(
        signupSuccessOpen,
        setSignupSuccessOpen,
        t("auth.signupSuccessTitle"),
        t("auth.signupSuccessBody")
      )}
      {successDialog(
        logoutSuccessOpen,
        setLogoutSuccessOpen,
        t("auth.logoutSuccessTitle"),
        t("auth.logoutSuccessBody")
      )}
    </>
  );
};

export default UserMenu;
