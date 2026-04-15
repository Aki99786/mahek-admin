import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";


export interface SidebarNavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}

export const sidebarData: SidebarNavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
    isActive: true,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    isActive: true,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
    isActive: true,
  },
  {
    title: "Teams",
    url: "/team",
    icon: Users,
    isActive: true,
  }
];





