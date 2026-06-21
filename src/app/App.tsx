import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "../lib/AuthContext";
import { CartProvider } from "../lib/CartContext";
import { FullscreenProvider } from "../lib/FullscreenContext";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FullscreenProvider>
          <RouterProvider router={router} />
        </FullscreenProvider>
      </CartProvider>
    </AuthProvider>
  );
}
