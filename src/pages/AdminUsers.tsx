import { useMemo, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useDirectoryUsers,
  useAssignRoleByEmail,
  useCreateUser,
  useUpdateDirectoryUser,
  useDeleteDirectoryUser,
  useUserRole,
  type AppRole,
  type DirectoryUser,
} from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  ShieldCheck,
  User,
  Users,
  Loader2,
  Plus,
  Search,
  Crown,
  Briefcase,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TranslationKey } from "@/i18n/translations";
import { APP_ROLES } from "@/lib/staticStaff";
import {
  defaultPermissionsForRole,
  resolveUserPermissions,
  type ModulePermissionsMap,
} from "@/lib/modulePermissions";
import { ModulePermissionsEditor } from "@/components/admin/ModulePermissionsEditor";

type RoleFilter = "all" | AppRole;

const ROLE_BADGE: Record<AppRole, { variant: "default" | "secondary" | "outline"; icon: typeof User }> = {
  owner: { variant: "default", icon: Crown },
  admin: { variant: "secondary", icon: ShieldCheck },
  staff: { variant: "secondary", icon: Briefcase },
  customer: { variant: "outline", icon: User },
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <Card className="admin-card-hover border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {label}
          <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", tone)}>
            <Icon className="h-5 w-5" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

const AdminUsers = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isOwner, canManageUsers, isLoading: roleLoading } = useUserRole();
  const { data: directory = [], isLoading } = useDirectoryUsers();
  const assignByEmail = useAssignRoleByEmail();
  const createUser = useCreateUser();
  const updateUser = useUpdateDirectoryUser();
  const deleteUser = useDeleteDirectoryUser();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [assignOpen, setAssignOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DirectoryUser | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("staff");
  const [deleteTarget, setDeleteTarget] = useState<DirectoryUser | null>(null);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState<AppRole>("admin");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirm, setCreateConfirm] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [createRole, setCreateRole] = useState<AppRole>("staff");
  const [createPermissions, setCreatePermissions] = useState<ModulePermissionsMap>(() =>
    defaultPermissionsForRole("staff"),
  );
  const [editPermissions, setEditPermissions] = useState<ModulePermissionsMap>(() =>
    defaultPermissionsForRole("staff"),
  );

  const roleLabel = (r: AppRole) => t(`admin.users.role.${r}` as TranslationKey);

  const creatableRoles: AppRole[] = isOwner
    ? APP_ROLES
    : APP_ROLES.filter((r) => r !== "owner");

  const selectableRoles: AppRole[] = APP_ROLES;

  const stats = useMemo(
    () => ({
      total: directory.length,
      owners: directory.filter((u) => u.role === "owner").length,
      admins: directory.filter((u) => u.role === "admin").length,
      staff: directory.filter((u) => u.role === "staff").length,
      customers: directory.filter((u) => u.role === "customer").length,
    }),
    [directory],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return directory.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      const hay = `${u.email ?? ""} ${u.full_name ?? ""} ${u.phone ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [directory, search, roleFilter]);

  const editRolesFor = (target: DirectoryUser): AppRole[] =>
    isOwner ? APP_ROLES : APP_ROLES.filter((r) => r !== "owner" || target.role === "owner");

  useEffect(() => {
    setCreatePermissions(defaultPermissionsForRole(createRole));
  }, [createRole]);

  const canModifyUser = (u: DirectoryUser) => {
    if (!canManageUsers || u.user_id === user?.id) return false;
    if (u.role === "owner" && !isOwner) return false;
    return true;
  };

  const openEdit = (u: DirectoryUser) => {
    setEditTarget(u);
    setEditFullName(u.full_name ?? "");
    setEditPhone(u.phone ?? "");
    setEditRole(u.role);
    setEditPermissions(resolveUserPermissions(u.user_id, u.role));
    setEditOpen(true);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    updateUser.mutate(
      {
        userId: editTarget.user_id,
        email: editTarget.email ?? "",
        fullName: editFullName.trim() || editTarget.email?.split("@")[0] || "User",
        phone: editPhone.trim() || undefined,
        role: editRole,
        createdAt: editTarget.created_at,
        permissions: editPermissions,
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          setEditTarget(null);
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.user_id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const UserActions = ({ u }: { u: DirectoryUser }) => {
    if (!canModifyUser(u)) {
      if (u.user_id === user?.id) {
        return <span className="text-xs text-muted-foreground">{t("admin.users.you")}</span>;
      }
      return null;
    }
    return (
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#174080] hover:bg-[#174080]/10"
          title={t("admin.users.editUser")}
          onClick={() => openEdit(u)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          title={t("admin.users.deleteUser")}
          onClick={() => setDeleteTarget(u)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const submitAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmail.trim()) return;
    assignByEmail.mutate(
      { email: assignEmail.trim(), role: assignRole },
      {
        onSuccess: () => {
          setAssignOpen(false);
          setAssignEmail("");
          setAssignRole("admin");
        },
      },
    );
  };

  const resetCreateForm = () => {
    setCreateEmail("");
    setCreatePassword("");
    setCreateConfirm("");
    setShowCreatePassword(false);
    setShowCreateConfirm(false);
    setCreateRole("staff");
    setCreatePermissions(defaultPermissionsForRole("staff"));
  };

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (createPassword.length < 6) {
      toast.error(t("profile.passwordTooShort"));
      return;
    }
    if (createPassword !== createConfirm) {
      toast.error(t("admin.users.passwordMismatch"));
      return;
    }
    createUser.mutate(
      {
        email: createEmail.trim(),
        password: createPassword,
        fullName: createEmail.trim().split("@")[0] || "User",
        role: createRole,
        permissions: createPermissions,
      },
      {
        onSuccess: () => {
          toast.success(t("admin.users.createSuccess"));
          setCreateOpen(false);
          resetCreateForm();
        },
      },
    );
  };

  if (!roleLoading && !canManageUsers) {
    return <Navigate to="/admin" replace />;
  }

  const RoleBadge = ({ role }: { role: AppRole }) => {
    const cfg = ROLE_BADGE[role];
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {roleLabel(role)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#174080]/10 text-[#174080]">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <p className="max-w-xl text-sm text-muted-foreground">{t("admin.users.pageHint")}</p>
            {!isOwner && canManageUsers && !roleLoading ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-sky-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("admin.users.adminCreateHint")}
              </p>
            ) : null}
          </div>
        </div>
        {canManageUsers ? (
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {t("admin.users.createUser")}
            </Button>
            {isOwner ? (
              <Button variant="outline" onClick={() => setAssignOpen(true)} className="gap-1.5">
                {t("admin.users.assignRole")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="admin-stagger grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label={t("admin.users.statTotal")}
          value={stats.total}
          icon={Users}
          tone="bg-[#174080]/10 text-[#174080]"
        />
        <StatCard
          label={t("admin.users.statOwners")}
          value={stats.owners}
          icon={Crown}
          tone="bg-violet-500/10 text-violet-600"
        />
        <StatCard
          label={t("admin.users.statAdmins")}
          value={stats.admins}
          icon={ShieldCheck}
          tone="bg-sky-500/10 text-sky-600"
        />
        <StatCard
          label={t("admin.users.statStaff")}
          value={stats.staff}
          icon={Briefcase}
          tone="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          label={t("admin.users.statCustomers")}
          value={stats.customers}
          icon={User}
          tone="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-[#174080]" />
              {t("admin.users.listTitle")}
            </CardTitle>
            <CardDescription className="mt-1">{t("admin.users.listHint")}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative sm:max-w-sm sm:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.users.search")}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder={t("admin.users.filterRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.users.filterAll")}</SelectItem>
                {selectableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || roleLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>{t("admin.users.noResults")}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {filtered.map((u) => (
                  <div key={u.user_id} className="space-y-3 rounded-xl border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email || "—"}</p>
                      </div>
                      <RoleBadge role={u.role} />
                    </div>
                    <div className="flex items-center justify-end pt-1">
                      <UserActions u={u} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.users.col.name")}</TableHead>
                      <TableHead>{t("admin.users.col.email")}</TableHead>
                      <TableHead>{t("admin.users.col.role")}</TableHead>
                      {canManageUsers ? <TableHead className="text-right">{t("admin.users.col.actions")}</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell className="text-sm">{u.email || "—"}</TableCell>
                        <TableCell>
                          <RoleBadge role={u.role} />
                        </TableCell>
                        {canManageUsers ? (
                          <TableCell className="text-right">
                            <UserActions u={u} />
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.users.createTitle")}</DialogTitle>
            <DialogDescription>{t("admin.users.createDesc")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCreate} className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-email">{t("admin.users.col.email")}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="create-email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="pl-9"
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="create-password"
                  type={showCreatePassword ? "text" : "password"}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  minLength={6}
                  className="pl-9 pr-10"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showCreatePassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t("admin.users.passwordHint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-confirm">{t("admin.users.confirmPassword")}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="create-confirm"
                  type={showCreateConfirm ? "text" : "password"}
                  value={createConfirm}
                  onChange={(e) => setCreateConfirm(e.target.value)}
                  minLength={6}
                  className="pl-9 pr-10"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCreateConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showCreateConfirm ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showCreateConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.users.dashboardRole")}</Label>
              <Select value={createRole} onValueChange={(v) => setCreateRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {creatableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("admin.users.dashboardRoleHint")}</p>
            </div>
            </div>
            <ModulePermissionsEditor
              value={createPermissions}
              onChange={setCreatePermissions}
              role={createRole}
              disabled={createUser.isPending}
            />
            <div className="flex justify-end gap-2 pt-2 lg:col-span-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? t("form.saving") : t("admin.users.createBtn")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.users.editTitle")}</DialogTitle>
            <DialogDescription>{t("admin.users.editDesc")}</DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <form onSubmit={submitEdit} className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("admin.users.col.email")}</Label>
                <Input value={editTarget.email ?? ""} readOnly disabled className="bg-muted/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">{t("auth.fullName")}</Label>
                <Input
                  id="edit-name"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder={t("auth.fullNamePlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">{t("admin.users.col.phone")}</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+855 ..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.users.dashboardRole")}</Label>
                <Select
                  value={editRole}
                  onValueChange={(v) => {
                    const next = v as AppRole;
                    setEditRole(next);
                    setEditPermissions(defaultPermissionsForRole(next));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editRolesFor(editTarget).map((r) => (
                      <SelectItem key={r} value={r}>
                        {roleLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
              <ModulePermissionsEditor
                value={editPermissions}
                onChange={setEditPermissions}
                role={editRole}
                disabled={updateUser.isPending}
              />
              <div className="flex justify-end gap-2 pt-2 lg:col-span-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  {t("form.cancel")}
                </Button>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? t("form.saving") : t("admin.users.saveUser")}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.users.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.deleteDesc")} {deleteTarget?.email ? `(${deleteTarget.email})` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("form.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? t("form.saving") : t("admin.users.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.users.assignTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitAssign} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("admin.users.assignDesc")}</p>
            <div className="space-y-1.5">
              <Label htmlFor="assign-email">{t("admin.users.col.email")}</Label>
              <Input
                id="assign-email"
                type="email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.users.col.role")}</Label>
              <Select value={assignRole} onValueChange={(v) => setAssignRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={assignByEmail.isPending}>
                {assignByEmail.isPending ? t("form.saving") : t("admin.users.assignBtn")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
