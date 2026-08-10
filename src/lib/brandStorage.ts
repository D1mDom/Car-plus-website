/** Reserved team_members.role values used when public.brands table is missing. */
export const BRAND_ROLE_ACTIVE = "__brand__";
export const BRAND_ROLE_HIDDEN = "__brand_hidden__";

export const isBrandRole = (role: string) =>
  role === BRAND_ROLE_ACTIVE || role === BRAND_ROLE_HIDDEN;
