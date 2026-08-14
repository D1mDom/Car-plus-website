import { useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRoles";
import { isEnvBootstrapAdmin } from "@/lib/staticStaff";
import {
  type AdminModule,
  type CrudAction,
  type ModulePermissionsMap,
  hasModulePermission,
  resolveUserPermissions,
} from "@/lib/modulePermissions";

export const useModulePermissions = () => {
  const { user } = useAuth();
  const { role, isOwner } = useUserRole();

  const permissions = useMemo(
    () => resolveUserPermissions(user?.id, role),
    [user?.id, role],
  );

  const can = useCallback(
    (module: AdminModule, action: CrudAction) => {
      if (!user) return false;
      if (isOwner || isEnvBootstrapAdmin(user.email)) return true;
      return hasModulePermission(user.id, role, module, action);
    },
    [user, isOwner, role],
  );

  const canReadModule = useCallback((module: AdminModule) => can(module, "read"), [can]);

  return { permissions, can, canReadModule, role, isOwner };
};

export type { AdminModule, CrudAction, ModulePermissionsMap };
