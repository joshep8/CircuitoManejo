import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "usuario" | "instructor" | "administrador";

export interface AuthState {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
}

export function useAuth(): AuthState & {
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
} {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    roles: [],
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const loadRoles = async (userId: string): Promise<AppRole[]> => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      return (data?.map((r) => r.role as AppRole) ?? []);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState((s) => ({ ...s, session, user: session?.user ?? null }));
      if (session?.user) {
        // Defer to avoid deadlock con onAuthStateChange
        setTimeout(async () => {
          const roles = await loadRoles(session.user.id);
          if (mounted) setState((s) => ({ ...s, roles, loading: false }));
        }, 0);
      } else {
        setState((s) => ({ ...s, roles: [], loading: false }));
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const roles = await loadRoles(session.user.id);
        if (mounted)
          setState({
            session,
            user: session.user,
            roles,
            loading: false,
          });
      } else {
        setState({ session: null, user: null, roles: [], loading: false });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    ...state,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    hasRole: (role: AppRole) => state.roles.includes(role),
  };
}

export function pickPrimaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("administrador")) return "administrador";
  if (roles.includes("instructor")) return "instructor";
  return "usuario";
}

export function dashboardPathFor(role: AppRole): string {
  switch (role) {
    case "administrador":
      return "/admin";
    case "instructor":
      return "/instructor";
    default:
      return "/dashboard";
  }
}
