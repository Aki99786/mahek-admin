import { ACTIONS, MODULES, ROLES, type Role } from "./constants";
import { createPermission, type Permission } from "./helpers";

export const PERMISSIONS = {
  [MODULES.DASHBOARD]: {
    [ACTIONS.VIEW]: createPermission(MODULES.DASHBOARD, ACTIONS.VIEW),
  },
  [MODULES.PRODUCTS]: {
    [ACTIONS.VIEW]: createPermission(MODULES.PRODUCTS, ACTIONS.VIEW),
    [ACTIONS.CREATE]: createPermission(MODULES.PRODUCTS, ACTIONS.CREATE),
    [ACTIONS.EDIT]: createPermission(MODULES.PRODUCTS, ACTIONS.EDIT),
    [ACTIONS.DELETE]: createPermission(MODULES.PRODUCTS, ACTIONS.DELETE),
  },
  [MODULES.USERS]: {
    [ACTIONS.VIEW]: createPermission(MODULES.USERS, ACTIONS.VIEW),
    [ACTIONS.CREATE]: createPermission(MODULES.USERS, ACTIONS.CREATE),
    [ACTIONS.EDIT]: createPermission(MODULES.USERS, ACTIONS.EDIT),
    [ACTIONS.DELETE]: createPermission(MODULES.USERS, ACTIONS.DELETE),
  },
  [MODULES.ORDERS]: {
    [ACTIONS.VIEW]: createPermission(MODULES.ORDERS, ACTIONS.VIEW),
    [ACTIONS.UPDATE]: createPermission(MODULES.ORDERS, ACTIONS.UPDATE),
    [ACTIONS.DELETE]: createPermission(MODULES.ORDERS, ACTIONS.DELETE),
  },
  [MODULES.TEAMS]: {
    [ACTIONS.VIEW]: createPermission(MODULES.TEAMS, ACTIONS.VIEW),
    [ACTIONS.CREATE]: createPermission(MODULES.TEAMS, ACTIONS.CREATE),
    [ACTIONS.EDIT]: createPermission(MODULES.TEAMS, ACTIONS.EDIT),
    [ACTIONS.DELETE]: createPermission(MODULES.TEAMS, ACTIONS.DELETE),
  },
} as const;

export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap((moduleActions) =>
  Object.values(moduleActions),
) as Permission[];

export const ROLES_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: [...ALL_PERMISSIONS],
  [ROLES.ADMIN]: [
    PERMISSIONS.dashboard.view,
    PERMISSIONS.products.view,
    PERMISSIONS.products.create,
    PERMISSIONS.products.edit,
    PERMISSIONS.products.delete,
    PERMISSIONS.users.view,
    PERMISSIONS.users.create,
    PERMISSIONS.users.edit,
    PERMISSIONS.orders.view,
    PERMISSIONS.orders.update,
    PERMISSIONS.teams.view,
    PERMISSIONS.teams.create,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.dashboard.view,
    PERMISSIONS.products.view,
    PERMISSIONS.products.create,
    PERMISSIONS.products.edit,
    PERMISSIONS.products.delete,
    PERMISSIONS.users.view,
    PERMISSIONS.users.create,
    PERMISSIONS.orders.view,
    PERMISSIONS.orders.update,
  ],
  [ROLES.USER]: [
    PERMISSIONS.dashboard.view,
    PERMISSIONS.products.view,
    PERMISSIONS.users.view,
    PERMISSIONS.orders.view,
  ],
};

