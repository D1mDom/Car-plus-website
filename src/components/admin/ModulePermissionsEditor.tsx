import { useLanguage } from "@/hooks/useLanguage";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ADMIN_MODULES,
  CRUD_ACTIONS,
  defaultPermissionsForRole,
  type AdminModule,
  type CrudAction,
  type ModulePermissionsMap,
} from "@/lib/modulePermissions";
import type { AppRole } from "@/lib/staticStaff";
import type { TranslationKey } from "@/i18n/translations";
import { Button } from "@/components/ui/button";

const MODULE_LABEL_KEYS: Record<AdminModule, TranslationKey> = {
  dashboard: "admin.permissions.module.dashboard",
  cars: "admin.permissions.module.cars",
  addCar: "admin.permissions.module.addCar",
  orders: "admin.permissions.module.orders",
  receipts: "admin.permissions.module.receipts",
  reports: "admin.permissions.module.reports",
  banners: "admin.permissions.module.banners",
  brands: "admin.permissions.module.brands",
  team: "admin.permissions.module.team",
  contact: "admin.permissions.module.contact",
  users: "admin.permissions.module.users",
  settings: "admin.permissions.module.settings",
};

const ACTION_LABEL_KEYS: Record<CrudAction, TranslationKey> = {
  create: "admin.permissions.create",
  read: "admin.permissions.read",
  update: "admin.permissions.update",
  delete: "admin.permissions.delete",
};

type Props = {
  value: ModulePermissionsMap;
  onChange: (next: ModulePermissionsMap) => void;
  role: AppRole;
  disabled?: boolean;
};

export function ModulePermissionsEditor({ value, onChange, role, disabled }: Props) {
  const { t } = useLanguage();

  const toggle = (mod: AdminModule, action: CrudAction, checked: boolean) => {
    onChange({
      ...value,
      [mod]: { ...value[mod], [action]: checked },
    });
  };

  const applyRoleDefaults = () => {
    onChange(defaultPermissionsForRole(role));
  };

  if (role === "owner") {
    return (
      <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {t("admin.permissions.ownerFullAccess")}
      </p>
    );
  }

  if (role === "customer") {
    return (
      <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {t("admin.permissions.customerNoAccess")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("admin.permissions.title")}</p>
        <Button type="button" variant="outline" size="sm" onClick={applyRoleDefaults} disabled={disabled}>
          {t("admin.permissions.resetDefaults")}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="min-w-[140px]">{t("admin.permissions.moduleCol")}</TableHead>
              {CRUD_ACTIONS.map((action) => (
                <TableHead key={action} className="w-[72px] text-center">
                  {t(ACTION_LABEL_KEYS[action])}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ADMIN_MODULES.map((mod) => (
              <TableRow key={mod}>
                <TableCell className="text-sm font-medium">{t(MODULE_LABEL_KEYS[mod])}</TableCell>
                {CRUD_ACTIONS.map((action) => (
                  <TableCell key={action} className="text-center">
                    <Switch
                      checked={value[mod][action]}
                      onCheckedChange={(checked) => toggle(mod, action, checked)}
                      disabled={disabled}
                      aria-label={`${t(MODULE_LABEL_KEYS[mod])} ${t(ACTION_LABEL_KEYS[action])}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
