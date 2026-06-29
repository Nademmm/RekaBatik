import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { RootLayout } from "./layouts/RootLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorPage } from "./components/ErrorPage";

export const router = createBrowserRouter([
  {
    path: "/auth",
    lazy: () =>
      import("./pages/AuthPage").then((module) => ({
        Component: module.AuthPage,
      })),
    errorElement: <ErrorPage />,
  },
  {
    path: "/",
    Component: RootLayout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: HomePage },
      {
        path: "custom",
        lazy: () =>
          import("./pages/CustomBatikPage").then((module) => ({
            Component: module.CustomBatikPage,
          })),
      },
      {
        path: "catalog",
        lazy: () =>
          import("./pages/CatalogPage").then((module) => ({
            Component: module.CatalogPage,
          })),
      },
      {
        path: "desa-jetis",
        lazy: () =>
          import("./pages/DesaJetisPage").then((module) => ({
            Component: module.DesaJetisPage,
          })),
      },
      {
        path: "desa-jetis/:storeId",
        lazy: () =>
          import("./pages/DesaJetisStoreDetailPage").then((module) => ({
            Component: module.DesaJetisStoreDetailPage,
          })),
      },
      {
        path: "belajar-batik",
        lazy: () =>
          import("./pages/BelajarBatikPage").then((module) => ({
            Component: module.BelajarBatikPage,
          })),
      },
      {
        path: "privacy-policy",
        lazy: () =>
          import("./pages/PrivacyPolicyPage").then((module) => ({
            Component: module.PrivacyPolicyPage,
          })),
      },
      {
        path: "terms-of-service",
        lazy: () =>
          import("./pages/TermsOfServicePage").then((module) => ({
            Component: module.TermsOfServicePage,
          })),
      },
      // Protected routes — require login
      {
        Component: ProtectedRoute,
        children: [
          {
            path: "orders",
            lazy: () =>
              import("./pages/OrdersPage").then((module) => ({
                Component: module.OrdersPage,
              })),
          },
          {
            path: "cart",
            lazy: () =>
              import("./pages/CartPage").then((module) => ({
                Component: module.CartPage,
              })),
          },
          {
            path: "desain-histori",
            lazy: () =>
              import("./pages/DesainHistoriPage").then((module) => ({
                Component: module.DesainHistoriPage,
              })),
          },
          {
            path: "chat",
            lazy: () =>
              import("./pages/ChatPage").then((module) => ({
                Component: module.ChatPage,
              })),
          },
          {
            path: "profile",
            lazy: () =>
              import("./pages/ProfilePage").then((module) => ({
                Component: module.ProfilePage,
              })),
          },
          {
            path: "admin",
            lazy: () =>
              import("./pages/AdminPage").then((module) => ({
                Component: module.AdminPage,
              })),
          },
          {
            path: "super-admin",
            lazy: () =>
              import("./pages/SuperAdminPage").then((module) => ({
                Component: module.SuperAdminPage,
              })),
          },
        ],
      },
    ],
  },
]);
