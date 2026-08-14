import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/staticStaff";
import {
  getStaticStaffRole,
  hasStaticDashboardAccess,
  isDashboardRole,
  isEnvBootstrapAdmin,
  isManagerRole,
} from "@/lib/staticStaff";

export const METADATA_ROLE_KEY = "app_role";

export const getMetadataRole = (user?: User | null): AppRole | null => {
  const raw = user?.user_metadata?.[METADATA_ROLE_KEY];
  if (raw === "owner" || raw === "admin" || raw === "staff" || raw === "customer") return raw;
  return null;
};

/** May open Car Plus admin dashboard (owner, admin, staff). */
export const hasDashboardAccess = (user?: User | null, isAdminRpc?: boolean): boolean => {
  if (!user) return false;
  if (isEnvBootstrapAdmin(user.email)) return true;

  const metaRole = getMetadataRole(user);
  if (isDashboardRole(metaRole)) return true;

  if (hasStaticDashboardAccess(user.id, user.email)) return true;
  if (isAdminRpc === true) return true;

  return false;
};

/** May create users and change roles (owner, admin only). */
export const canManageUsers = (user?: User | null, isAdminRpc?: boolean): boolean => {
  if (!user) return false;
  if (isEnvBootstrapAdmin(user.email)) return true;

  const metaRole = getMetadataRole(user);
  if (isManagerRole(metaRole)) return true;

  if (isManagerRole(getStaticStaffRole(user.id, user.email))) return true;
  if (isAdminRpc === true) return true;

  return false;
};

export const resolveUserRole = (user?: User | null, isAdminRpc?: boolean): AppRole => {
  const meta = getMetadataRole(user);
  if (meta) return meta;
  const staticRole = getStaticStaffRole(user?.id, user?.email);
  if (staticRole) return staticRole;
  if (isEnvBootstrapAdmin(user?.email)) return "owner";
  if (isAdminRpc) return "admin";
  return "customer";
};

export const staffMetadata = (fullName: string, role: AppRole) => ({
  full_name: fullName.trim(),
  [METADATA_ROLE_KEY]: role,
});
