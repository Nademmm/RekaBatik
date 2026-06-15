import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { CustomBatikPage } from "./pages/CustomBatikPage";
import { CatalogPage } from "./pages/CatalogPage";
import { OrdersPage } from "./pages/OrdersPage";
import { DesaJetisPage } from "./pages/DesaJetisPage";
import { DesaJetisStoreDetailPage } from "./pages/DesaJetisStoreDetailPage";
import { AuthPage } from "./pages/AuthPage";
import { CartPage } from "./pages/CartPage";
import { RootLayout } from "./layouts/RootLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorPage } from "./components/ErrorPage";

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: AuthPage,
    errorElement: <ErrorPage />,
  },
  {
    path: "/",
    Component: RootLayout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: HomePage },
      { path: "custom", Component: CustomBatikPage },
      { path: "catalog", Component: CatalogPage },
      { path: "desa-jetis", Component: DesaJetisPage },
      { path: "desa-jetis/:storeId", Component: DesaJetisStoreDetailPage },
      // Protected routes — require login
      {
        Component: ProtectedRoute,
        children: [
          { path: "orders", Component: OrdersPage },
          { path: "cart", Component: CartPage },
        ],
      },
    ],
  },
]);


