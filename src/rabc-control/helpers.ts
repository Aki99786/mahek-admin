import type { Action, Module, Role } from "./constants";

export type Permission = `${Module}_${Action}`;
export type PermissionState = Record<Permission, boolean>;

export const createPermission = (module: Module, action: Action): Permission =>
  `${module}_${action}` as Permission;

export const buildPermissionState = (
  allPermissions: readonly Permission[],
  selectedPermissions: readonly Permission[],
): PermissionState => {
  const selectedSet = new Set(selectedPermissions);
  return allPermissions.reduce(
    (acc, permission) => {
      acc[permission] = selectedSet.has(permission);
      return acc;
    },
    {} as PermissionState,
  );
};

export const selectedPermissionsFromState = (
  permissionState: PermissionState,
): Permission[] =>
  (Object.entries(permissionState) as Array<[Permission, boolean]>)
    .filter(([, isChecked]) => isChecked)
    .map(([permission]) => permission);

export const hasAtLeastOnePermission = (permissionState: PermissionState): boolean =>
  selectedPermissionsFromState(permissionState).length > 0;

export const createRbacPayload = (values: {
  name: string;
  role: Role;
  permissions: PermissionState;
}) => ({
  name: values.name,
  role: values.role,
  permissions: selectedPermissionsFromState(values.permissions),
});

