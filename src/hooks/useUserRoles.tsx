import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useLanguage } from "./useLanguage";
import { toast } from "sonner";
import {
  filterDeletedUsers,
  markUserDeleted,
  setStaticStaffRole,
  staticStaffAsDirectory,
  upsertStaticStaff,
  type AppRole,
  type StaticStaffUser,
} from "@/lib/staticStaff";
import {
  defaultPermissionsForRole,
  deleteStoredPermissionsForUser,
  setStoredPermissionsForUser,
  type ModulePermissionsMap,
} from "@/lib/modulePermissions";
import { hasDashboardAccess, resolveUserRole, staffMetadata } from "@/lib/dashboardAccess";
import { ensureUserProfile } from "@/lib/userProfileBootstrap";

export type { AppRole };

export interface DirectoryUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: AppRole;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { rpc: (fn: string, args?: Record<string, unknown>) => any };

const msg = (e: unknown) =>
  e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "error";

const toError = (e: unknown) => (e instanceof Error ? e : new Error(msg(e)));

const AUTH_ERROR = "Not authenticated";

async function resolveAdminSession(preferred?: Session | null): Promise<Session> {
  if (preferred?.access_token && preferred.refresh_token) {
    const { data: check } = await supabase.auth.getUser(preferred.access_token);
    if (check.user) return preferred;
  }

  const { data: current } = await supabase.auth.getSession();
  if (current.session?.access_token) return current.session;

  const { data: refreshed } = await supabase.auth.refreshSession();
  if (refreshed.session?.access_token) return refreshed.session;

  throw new Error(AUTH_ERROR);
}

async function restoreAdminSession(tokens: {
  access_token: string;
  refresh_token: string;
}): Promise<Session> {
  const { data, error } = await supabase.auth.setSession(tokens);
  if (error || !data.session) {
    throw new Error(AUTH_ERROR);
  }
  return data.session;
}

async function syncUserToCloud(
  userId: string,
  input: { fullName: string; phone?: string; role: AppRole },
) {
  const { error: syncErr } = await db.rpc("admin_sync_directory_user", {
    _target_user_id: userId,
    _full_name: input.fullName.trim(),
    _phone: input.phone?.trim() ?? "",
    _role: input.role,
  });
  if (syncErr) {
    console.warn("admin_sync_directory_user:", syncErr.message);
    if (input.role !== "staff") {
      const { error: legacyErr } = await db.rpc("set_user_role", {
        _target_user_id: userId,
        _new_role: input.role,
      });
      if (legacyErr) console.warn("set_user_role:", legacyErr.message);
    }
  }
}

const mergeDirectory = (remote: DirectoryUser[], local: StaticStaffUser[]): DirectoryUser[] => {
  const map = new Map<string, DirectoryUser>();
  for (const row of remote) map.set(row.user_id, { ...row });
  for (const row of local) {
    const prev = map.get(row.user_id);
    map.set(row.user_id, {
      user_id: row.user_id,
      email: row.email || prev?.email || null,
      full_name: row.full_name || prev?.full_name || null,
      phone: row.phone || prev?.phone || null,
      role: row.role ?? prev?.role ?? "customer",
      created_at: row.created_at || prev?.created_at || new Date().toISOString(),
    });
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
};

const filterDirectory = (rows: DirectoryUser[]) => filterDeletedUsers(rows);

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.id, user?.email],
    queryFn: async (): Promise<AppRole> => {
      const { data: adminOk } = await supabase.rpc("is_admin", { _user_id: user!.id });
      return resolveUserRole(user!, adminOk === true);
    },
    enabled: !!user?.id,
  });

  const resolved = role ?? "customer";

  return {
    role: resolved,
    isOwner: resolved === "owner",
    isAdmin: resolved === "owner" || resolved === "admin",
    isStaff: resolved === "staff",
    canAccessDashboard: resolved === "owner" || resolved === "admin" || resolved === "staff",
    canManageUsers: resolved === "owner" || resolved === "admin",
    isCustomer: resolved === "customer",
    isLoading,
  };
};

export const useDirectoryUsers = () =>
  useQuery({
    queryKey: ["directory-users"],
    queryFn: async (): Promise<DirectoryUser[]> => {
      const local = staticStaffAsDirectory();

      try {
        const { data, error } = await db.rpc("list_directory_users");
        if (!error && data) {
          return filterDirectory(mergeDirectory((data ?? []) as DirectoryUser[], local));
        }
      } catch {
        /* use static list only */
      }

      return filterDirectory(
        local.map((row) => ({
          user_id: row.user_id,
          email: row.email,
          full_name: row.full_name,
          phone: row.phone,
          role: row.role,
          created_at: row.created_at,
        })),
      );
    },
    refetchOnMount: "always",
  });

export const useSetUserRole = () => {
  const qc = useQueryClient();
  const { t } = useLanguage();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      setStaticStaffRole(userId, role);

      const { error } = await db.rpc("set_user_role", {
        _target_user_id: userId,
        _new_role: role,
      });
      if (error) console.warn("set_user_role:", error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["directory-users"] });
      void qc.invalidateQueries({ queryKey: ["user-role"] });
      void qc.invalidateQueries({ queryKey: ["admin-status"] });
      toast.success(t("admin.users.toast.roleUpdated"));
    },
    onError: (e) => toast.error(msg(e)),
  });
};

export const useAssignRoleByEmail = () => {
  const qc = useQueryClient();
  const { t } = useLanguage();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      const normalized = email.trim().toLowerCase();
      const localRows = staticStaffAsDirectory();
      const existing = localRows.find((r) => r.email === normalized);
      if (existing) {
        setStaticStaffRole(existing.user_id, role);
      }

      const { data, error } = await db.rpc("assign_role_by_email", {
        _email: normalized,
        _new_role: role,
      });
      if (error && !existing) throw error;
      return (data as string | undefined) ?? existing?.user_id ?? "";
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["directory-users"] });
      toast.success(t("admin.users.toast.roleAssigned"));
    },
    onError: (e) => toast.error(msg(e)),
  });
};

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
  phone?: string;
  permissions?: ModulePermissionsMap;
}

async function createUserViaSignUp(input: CreateUserInput, preferredSession?: Session | null) {
  const email = input.email.trim().toLowerCase();
  const adminSession = await resolveAdminSession(preferredSession);

  if (!hasDashboardAccess(adminSession.user, undefined)) {
    const { data: adminOk } = await supabase.rpc("is_admin", { _user_id: adminSession.user.id });
    if (!hasDashboardAccess(adminSession.user, adminOk === true)) {
      throw new Error("Admin access required");
    }
  }

  const adminTokens = {
    access_token: adminSession.access_token,
    refresh_token: adminSession.refresh_token,
  };

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: staffMetadata(input.fullName, input.role),
    },
  });

  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      throw new Error("An account with this email already exists");
    }
    throw toError(error);
  }

  if (!data.user) throw new Error("User creation failed");

  if (data.user.identities?.length === 0) {
    throw new Error("An account with this email already exists");
  }

  const newUserId = data.user.id;
  const createdAt = new Date().toISOString();

  upsertStaticStaff({
    user_id: newUserId,
    email,
    full_name: input.fullName.trim() || null,
    phone: input.phone?.trim() || null,
    role: input.role,
    created_at: createdAt,
  });

  setStoredPermissionsForUser(
    newUserId,
    input.permissions ?? defaultPermissionsForRole(input.role),
  );

  const {
    data: { session: afterSignUp },
  } = await supabase.auth.getSession();

  if (afterSignUp?.user.id === newUserId) {
    await ensureUserProfile(afterSignUp.user);
  }

  await restoreAdminSession(adminTokens);

  await syncUserToCloud(newUserId, {
    fullName: input.fullName,
    phone: input.phone,
    role: input.role,
  });

  return { userId: newUserId, email, role: input.role };
}

export const useCreateUser = () => {
  const qc = useQueryClient();
  const { session } = useAuth();
  const { t } = useLanguage();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUserViaSignUp(input, session),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["directory-users"] });
      void qc.invalidateQueries({ queryKey: ["admin-status"] });
      void qc.invalidateQueries({ queryKey: ["user-role"] });
      toast.success(t("admin.users.createSuccess"));
    },
    onError: (e) => {
      const m = msg(e);
      if (m === AUTH_ERROR) {
        toast.error(t("admin.users.notAuthenticated"));
      } else {
        toast.error(m);
      }
    },
  });
};

export interface UpdateDirectoryUserInput {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  role: AppRole;
  createdAt: string;
  permissions?: ModulePermissionsMap;
}

export const useUpdateDirectoryUser = () => {
  const qc = useQueryClient();
  const { t } = useLanguage();
  return useMutation({
    mutationFn: async (input: UpdateDirectoryUserInput) => {
      upsertStaticStaff({
        user_id: input.userId,
        email: input.email.trim().toLowerCase(),
        full_name: input.fullName.trim() || null,
        phone: input.phone?.trim() || null,
        role: input.role,
        created_at: input.createdAt,
      });

      const { error } = await db.rpc("admin_sync_directory_user", {
        _target_user_id: input.userId,
        _full_name: input.fullName.trim() || input.email.split("@")[0] || "User",
        _phone: input.phone?.trim() ?? "",
        _role: input.role,
      });
      if (error) {
        console.warn("admin_sync_directory_user:", error.message);
        const { error: legacyErr } = await db.rpc("set_user_role", {
          _target_user_id: input.userId,
          _new_role: input.role === "staff" ? "customer" : input.role,
        });
        if (legacyErr) console.warn("set_user_role:", legacyErr.message);
      }

      try {
        await db.rpc("staff_update_profile_phone", {
          _user_id: input.userId,
          _phone: input.phone?.trim() ?? "",
        });
      } catch {
        /* optional RPC */
      }

      if (input.permissions) {
        setStoredPermissionsForUser(input.userId, input.permissions);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["directory-users"] });
      void qc.invalidateQueries({ queryKey: ["user-role"] });
      void qc.invalidateQueries({ queryKey: ["admin-status"] });
      toast.success(t("admin.users.editSuccess"));
    },
    onError: (e) => toast.error(msg(e)),
  });
};

export const useDeleteDirectoryUser = () => {
  const qc = useQueryClient();
  const { t } = useLanguage();
  return useMutation({
    mutationFn: async (userId: string) => {
      markUserDeleted(userId);
      deleteStoredPermissionsForUser(userId);
      try {
        await db.rpc("admin_sync_directory_user", {
          _target_user_id: userId,
          _role: "customer",
        });
      } catch {
        const { error } = await db.rpc("set_user_role", {
          _target_user_id: userId,
          _new_role: "customer",
        });
        if (error) console.warn("set_user_role:", error.message);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["directory-users"] });
      void qc.invalidateQueries({ queryKey: ["admin-status"] });
      toast.success(t("admin.users.deleteSuccess"));
    },
    onError: (e) => toast.error(msg(e)),
  });
};
