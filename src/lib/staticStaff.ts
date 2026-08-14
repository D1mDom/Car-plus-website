export type AppRole = "owner" | "admin" | "staff" | "customer";

export const APP_ROLES: AppRole[] = ["owner", "admin", "staff", "customer"];
export const DASHBOARD_ROLES: AppRole[] = ["owner", "admin", "staff"];
export const MANAGER_ROLES: AppRole[] = ["owner", "admin"];

export interface StaticStaffUser {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: AppRole;
  created_at: string;
}

const LOCAL_KEY = "carplus-staff-v1";

export const isDashboardRole = (role: AppRole | null | undefined): boolean =>
  role === "owner" || role === "admin" || role === "staff";

export const isManagerRole = (role: AppRole | null | undefined): boolean =>
  role === "owner" || role === "admin";

const parseRole = (value: unknown): AppRole => {
  if (value === "owner" || value === "admin" || value === "staff" || value === "customer") return value;
  return "customer";
};

export const readStaticStaff = (): StaticStaffUser[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StaticStaffUser[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => ({
      user_id: String(row.user_id ?? ""),
      email: String(row.email ?? "").toLowerCase(),
      full_name: row.full_name ?? null,
      phone: row.phone ?? null,
      role: parseRole(row.role),
      created_at: row.created_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
};

export const writeStaticStaff = (rows: StaticStaffUser[]) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
};

export const upsertStaticStaff = (entry: StaticStaffUser) => {
  const rows = readStaticStaff();
  const email = entry.email.toLowerCase();
  const idx = rows.findIndex((r) => r.user_id === entry.user_id || r.email === email);
  const next = { ...entry, email };
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...next };
  } else {
    rows.push(next);
  }
  writeStaticStaff(rows);
};

export const setStaticStaffRole = (userId: string, role: AppRole) => {
  const rows = readStaticStaff();
  const idx = rows.findIndex((r) => r.user_id === userId);
  if (idx < 0) return false;
  rows[idx] = { ...rows[idx], role };
  writeStaticStaff(rows);
  return true;
};

export const getStaticStaffRole = (userId?: string | null, email?: string | null): AppRole | null => {
  const rows = readStaticStaff();
  const byId = userId ? rows.find((r) => r.user_id === userId) : undefined;
  if (byId) return byId.role;
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  const byEmail = rows.find((r) => r.email === normalized);
  return byEmail?.role ?? null;
};

/** Owner or admin (can manage users). */
export const isStaticStaffAdmin = (userId?: string | null, email?: string | null) => {
  const role = getStaticStaffRole(userId, email);
  return isManagerRole(role);
};

/** Owner, admin, or staff — may open dashboard. */
export const hasStaticDashboardAccess = (userId?: string | null, email?: string | null) => {
  const role = getStaticStaffRole(userId, email);
  return isDashboardRole(role);
};

export const staticStaffAsDirectory = (): StaticStaffUser[] =>
  [...readStaticStaff()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

export const envBootstrapEmails = (): string[] =>
  (import.meta.env.VITE_STATIC_ADMIN_EMAILS as string | undefined ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const deleteStaticStaff = (userId: string) => {
  writeStaticStaff(readStaticStaff().filter((r) => r.user_id !== userId));
};

const DELETED_KEY = "carplus-staff-deleted-v1";

export const readDeletedUserIds = (): string[] => {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const markUserDeleted = (userId: string) => {
  const ids = new Set(readDeletedUserIds());
  ids.add(userId);
  localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
  deleteStaticStaff(userId);
};

export const isUserDeleted = (userId: string) => readDeletedUserIds().includes(userId);

export const filterDeletedUsers = <T extends { user_id: string }>(rows: T[]) =>
  rows.filter((r) => !isUserDeleted(r.user_id));

export const isEnvBootstrapAdmin = (email?: string | null) => {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return envBootstrapEmails().includes(normalized);
};
