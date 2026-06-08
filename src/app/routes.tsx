import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { CustomBatikPage } from "./pages/CustomBatikPage";
import { CatalogPage } from "./pages/CatalogPage";
import { OrdersPage } from "./pages/OrdersPage";
import { DesaJetisPage } from "./pages/DesaJetisPage";
import { RootLayout } from "./layouts/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "custom", Component: CustomBatikPage },
      { path: "catalog", Component: CatalogPage },
      { path: "orders", Component: OrdersPage },
      { path: "desa-jetis", Component: DesaJetisPage },
    ],
  },
]);
