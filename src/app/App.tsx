import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "../lib/AuthContext";
import { CartProvider } from "../lib/CartContext";
import { FullscreenProvider } from "../lib/FullscreenContext";

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-6">
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#D4B88B]/35 border-t-[#8B6F47]"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-[#7A6B5E]">Memuat halaman...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FullscreenProvider>
          <RouterProvider router={router} fallbackElement={<RouteLoadingFallback />} />
        </FullscreenProvider>
      </CartProvider>
    </AuthProvider>
  );
}
