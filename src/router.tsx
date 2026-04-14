import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";

import LoadingSpinner from "./shared-component/loading/LoadingSpinner";
import AuthGuard from "./guards/Auth.guard";
import ProjectGuard from "./guards/Project.guard";

// Auth
const AuthLayout = lazy(() => import("./auth/auth-layout/AuthLayout"));
const LoginPage = lazy(() => import("./auth/pages/LoginPage"));

// Layout Module & coponent
const ProjectLayout = lazy(() => import("./project-layout/ProjectLayout"));

// Dashboard
const DashboardPage = lazy(
  () => import("./modules/shared-modules/pages/DashboardPage"),
);

// Products
const ProductLayout = lazy(
  () => import("./modules/products/layouts/ProductsLayout"),
);
const ProductListPage = lazy(
  () => import("./modules/products/pages/ProductsListPage"),
);
const AddEditProductPage = lazy(
  () => import("./modules/products/pages/AddEditProductPage"),
);

const ProductDetailPage = lazy(
  () => import("./modules/products/pages/ProductDetailPage"),
);




// Users
const UserLayout = lazy(() => import("./modules/users/layouts/UsersLayout"));
const UserListPage = lazy(() => import("./modules/users/pages/UsersListPage"));
const AddEditUserPage = lazy(
  () => import("./modules/users/pages/AddEditUserPage"),
);
const UserDetailPage = lazy(
  () => import("./modules/users/pages/UserDetailPage"),
);

// Orders
const OrderLayout = lazy(() => import("./modules/orders/layouts/OrdersLayout"));
const OrderListPage = lazy(
  () => import("./modules/orders/pages/OrdersListPage"),
);
const AddEditOrderPage = lazy(
  () => import("./modules/orders/pages/AddEditOrderPage"),
);
const OrderDetailPage = lazy(
  () => import("./modules/orders/pages/OrderDetailPage"),
);

const CheckoutAddressPage = lazy(
  () => import("./features/checkout/address/CheckoutAddressPage"),
);

// ===== Reusable Suspense Wrapper =====
const withSuspense = (Component: any) => (
  <Suspense fallback={<LoadingSpinner />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "auth",
    element: <ProjectGuard>{withSuspense(AuthLayout)}</ProjectGuard>,
    children: [
      {
        path: "login",
        element: withSuspense(LoginPage),
      },
    ],
  },

  {
    path: "",
    element: <AuthGuard>{withSuspense(ProjectLayout)}</AuthGuard>,
    children: [
      // Dashboard
      { path: "dashboard", element: withSuspense(DashboardPage) },

      // Products
      {
        path: "products",
        element: withSuspense(ProductLayout),
        children: [
          { index: true, element: withSuspense(ProductListPage) },
          { path: "add-product", element: withSuspense(AddEditProductPage) },
          {
            path: "edit-product/:id",
            element: withSuspense(AddEditProductPage),
          },
          { path: "detail/:id", element: withSuspense(ProductDetailPage) },


          // { path: "new-add-product", element: withSuspense(NewAddEditProductPage) },
          // {
          //   path: "new-edit-product/:id",
          //   element: withSuspense(NewAddEditProductPage),
          // },
          // { path: "new-detail/:id", element: withSuspense(NewProductDetailPage) },
        ],
      },

      // Users
      {
        path: "users",
        element: withSuspense(UserLayout),
        children: [
          { index: true, element: withSuspense(UserListPage) },
          { path: "add-user", element: withSuspense(AddEditUserPage) },
          { path: "edit-user/:id", element: withSuspense(AddEditUserPage) },
          { path: "detail/:id", element: withSuspense(UserDetailPage) },
        ],
      },

      // Orders
      {
        path: "orders",
        element: withSuspense(OrderLayout),
        children: [
          { index: true, element: withSuspense(OrderListPage) },
          { path: "add-order", element: withSuspense(AddEditOrderPage) },
          { path: "edit-order/:id", element: withSuspense(AddEditOrderPage) },
          { path: "detail/:id", element: withSuspense(OrderDetailPage) },
        ],
      },

      // Cart & checkout (customer-style flow in admin shell)
      { path: "checkout/address", element: withSuspense(CheckoutAddressPage) },
    ],
  },
]);
