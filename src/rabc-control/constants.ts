export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  USER: "user",
} as const;

export const MODULES = {
  DASHBOARD: "dashboard",
  PRODUCTS: "products",
  USERS: "users",
  ORDERS: "orders",
  TEAMS: "teams",
} as const;

export const ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  UPDATE: "update",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type Module = (typeof MODULES)[keyof typeof MODULES];
export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

export const ROLE_OPTIONS = [
  { _id: 1, role: "Super Admin", value: ROLES.SUPER_ADMIN },
  { _id: 2, role: "Admin", value: ROLES.ADMIN },
  { _id: 3, role: "Manager", value: ROLES.MANAGER },
  { _id: 4, role: "User", value: ROLES.USER },
] as const;

