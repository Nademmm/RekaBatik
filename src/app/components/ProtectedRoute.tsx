import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../lib/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Wraps routes that require authentication.
 * - Loading  → shows a centered spinner
 * - No user  → redirects to /auth, saving current path in ?redirect= param
 * - Has user → renders child routes via <Outlet />
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F5" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="w-10 h-10 animate-spin"
            style={{ color: "#8B6F47" }}
          />
          <p style={{ color: "#7A6B5E", fontSize: "0.9rem" }}>Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
