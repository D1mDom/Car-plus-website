import type { AppRole } from "@/lib/staticStaff";

export type CrudAction = "create" | "read" | "update" | "delete";

export type AdminModule =
  | "dashboard"
  | "cars"
  | "addCar"
  | "orders"
  | "receipts"
  | "reports"
  | "banners"
  | "brands"
  | "team"
  | "contact"
  | "users"
  | "settings";

export const ADMIN_MODULES: AdminModule[] = [
  "dashboard",
  "cars",
  "addCar",
  "orders",
  "receipts",
  "reports",
  "banners",
  "brands",
  "team",
  "contact",
  "users",
  "settings",
];

export const CRUD_ACTIONS: CrudAction[] = ["create", "read", "update", "delete"];

export type CrudPermissions = Record<CrudAction, boolean>;

export type ModulePermissionsMap = Record<AdminModule, CrudPermissions>;

export interface StoredUserPermissions {
  user_id: string;
  modules: ModulePermissionsMap;
}

const LOCAL_KEY = "carplus-module-permissions-v1";

const allOn = (): CrudPermissions => ({ create: true, read: true, update: true, delete: true });
const readOnly = (): CrudPermissions => ({ create: false, read: true, update: false, delete: false });
const readWrite = (): CrudPermissions => ({ create: true, read: true, update: true, delete: false });
const none = (): CrudPermissions => ({ create: false, read: false, update: false, delete: false });

export const fullPermissions = (): ModulePermissionsMap =>
  Object.fromEntries(ADMIN_MODULES.map((m) => [m, allOn()])) as ModulePermissionsMap;

const staffSales = readWrite();
const staffRead = readOnly();

export const defaultPermissionsForRole = (role: AppRole): ModulePermissionsMap => {
  if (role === "owner" || role === "admin") return fullPermissions();

  if (role === "staff") {
    return {
      dashboard: staffRead,
      cars: staffSales,
      addCar: { create: true, read: true, update: false, delete: false },
      orders: staffSales,
      receipts: staffSales,
      reports: staffRead,
      banners: staffRead,
      brands: staffRead,
      team: staffRead,
      contact: staffRead,
      users: none(),
      settings: staffRead,
    };
  }

  return Object.fromEntries(ADMIN_MODULES.map((m) => [m, none()])) as ModulePermissionsMap;
};

export const readStoredPermissions = (): StoredUserPermissions[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUserPermissions[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => ({
      user_id: String(row.user_id ?? ""),
      modules: normalizeModules(row.modules),
    }));
  } catch {
    return [];
  }
};

const normalizeCrud = (value: Partial<CrudPermissions> | undefined, fallback: CrudPermissions): CrudPermissions => ({
  create: value?.create ?? fallback.create,
  read: value?.read ?? fallback.read,
  update: value?.update ?? fallback.update,
  delete: value?.delete ?? fallback.delete,
});

export const normalizeModules = (
  modules: Partial<Record<AdminModule, Partial<CrudPermissions>>> | undefined,
  fallbackRole: AppRole = "staff",
): ModulePermissionsMap => {
  const defaults = defaultPermissionsForRole(fallbackRole);
  return Object.fromEntries(
    ADMIN_MODULES.map((mod) => [mod, normalizeCrud(modules?.[mod], defaults[mod])]),
  ) as ModulePermissionsMap;
};

export const writeStoredPermissions = (rows: StoredUserPermissions[]) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
};

export const getStoredPermissionsForUser = (userId: string): ModulePermissionsMap | null => {
  const row = readStoredPermissions().find((r) => r.user_id === userId);
  return row?.modules ?? null;
};

export const setStoredPermissionsForUser = (userId: string, modules: ModulePermissionsMap) => {
  const rows = readStoredPermissions();
  const idx = rows.findIndex((r) => r.user_id === userId);
  const entry: StoredUserPermissions = { user_id: userId, modules: normalizeModules(modules) };
  if (idx >= 0) rows[idx] = entry;
  else rows.push(entry);
  writeStoredPermissions(rows);
};

export const deleteStoredPermissionsForUser = (userId: string) => {
  writeStoredPermissions(readStoredPermissions().filter((r) => r.user_id !== userId));
};

export const resolveUserPermissions = (
  userId: string | null | undefined,
  role: AppRole,
): ModulePermissionsMap => {
  if (role === "owner") return fullPermissions();
  const stored = userId ? getStoredPermissionsForUser(userId) : null;
  if (stored) return normalizeModules(stored, role);
  return defaultPermissionsForRole(role);
};

export const hasModulePermission = (
  userId: string | null | undefined,
  role: AppRole,
  module: AdminModule,
  action: CrudAction,
): boolean => {
  if (role === "owner") return true;
  if (role === "customer") return false;
  const perms = resolveUserPermissions(userId, role);
  return perms[module]?.[action] ?? false;
};

/** Map admin routes to permission modules. */
export const routeToModule = (path: string): AdminModule | null => {
  if (path === "/admin" || path === "/admin/") return "dashboard";
  if (path.startsWith("/admin/cars")) return "cars";
  if (path.startsWith("/admin/add-car")) return "addCar";
  if (path.startsWith("/admin/orders")) return "orders";
  if (path.startsWith("/admin/receipts")) return "receipts";
  if (path.startsWith("/admin/reports")) return "reports";
  if (path.startsWith("/admin/banners")) return "banners";
  if (path.startsWith("/admin/brands")) return "brands";
  if (path.startsWith("/admin/team")) return "team";
  if (path.startsWith("/admin/contact")) return "contact";
  if (path.startsWith("/admin/users")) return "users";
  if (path.startsWith("/admin/settings")) return "settings";
  return null;
};

export const navPathToModule = (to: string): AdminModule | null => routeToModule(to);
