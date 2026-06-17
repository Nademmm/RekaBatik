import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "../lib/AuthContext";
import { CartProvider } from "../lib/CartContext";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  );
}
