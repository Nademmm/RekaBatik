import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type UserRole = "customer" | "artisan" | "super_admin" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const resolveRole = (u: User | null): UserRole => {
    if (!u) return null;
    const meta = u.user_metadata?.role as string | undefined;
    if (meta === "super_admin") return "super_admin";
    if (meta === "artisan") return "artisan";
    return "customer";
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(resolveRole(session?.user ?? null));
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Only update if session ID or user ID changed, or if it's a critical event
        // This prevents re-renders on every token refresh if the user object is technically new but the same identity
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          setSession(session);
          setUser(session?.user ?? null);
          setUserRole(resolveRole(session?.user ?? null));
        } else if (session?.user?.id !== user?.id) {
          // Fallback check if identity changed during other events
          setSession(session);
          setUser(session?.user ?? null);
          setUserRole(resolveRole(session?.user ?? null));
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Sync subscription status from premium_subscriptions table to user_metadata
  useEffect(() => {
    if (!user) return;
    const syncSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from("premium_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("id", { ascending: false })
          .limit(1);

        if (error) return;
        if (data && data.length > 0) {
          const latestSub = data[0];
          const isExpired = new Date(latestSub.expires_at) < new Date();

          let targetPlan = "gratis";
          let targetExpires = null;
          let targetPending = false;

          if (!isExpired) {
            if (latestSub.status === "approved") {
              targetPlan = latestSub.plan_id;
              targetExpires = latestSub.expires_at;
            } else if (latestSub.status === "pending") {
              targetPending = true;
            }
          }

          const currentPlan = user.user_metadata?.subscription_plan || "gratis";
          const currentExpires = user.user_metadata?.subscription_expires_at || null;
          const currentPending = !!user.user_metadata?.subscription_pending;

          if (
            currentPlan !== targetPlan ||
            currentExpires !== targetExpires ||
            currentPending !== targetPending
          ) {
            await supabase.auth.updateUser({
              data: {
                subscription_plan: targetPlan,
                subscription_expires_at: targetExpires,
                subscription_pending: targetPending,
              },
            });
          }
        }
      } catch (err) {
        console.error("Subscription sync failed:", err);
      }
    };
    syncSubscription();
  }, [user?.id, user?.user_metadata]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
