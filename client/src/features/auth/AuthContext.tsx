import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from "react";
import { api } from "../../lib/api";
import type { Company, JobSeekerProfile, MeResponse, RecruiterProfile, User, UserRole } from "../../types";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "admin">;
}

interface AuthContextValue {
  user: User | null;
  profile: JobSeekerProfile | RecruiterProfile | null;
  company: Company | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  googleLogin: (credential: string, role?: Exclude<UserRole, "admin">) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const dashboardPathForRole = (role: UserRole): string => {
  const map: Record<UserRole, string> = {
    job_seeker: "/dashboard/job-seeker",
    employer: "/dashboard/employer",
    recruiter: "/dashboard/recruiter",
    admin: "/dashboard/admin"
  };

  return map[role];
};

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const meQuery = useQuery<MeResponse | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await api.get<MeResponse>("/auth/me");
      } catch (error) {
        if ((error as { status?: number }).status === 401) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
    staleTime: 60_000
  });

  const applySession = useCallback(
    (user: User) => {
      queryClient.setQueryData<MeResponse | null>(["auth", "me"], {
        user,
        profile: null,
        company: null
      } as MeResponse);
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    [queryClient]
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await api.post<{ user: User }>("/auth/login", input);
      applySession(response.user);
      return response.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await api.post<{ user: User }>("/auth/register", input);
      applySession(response.user);
      return response.user;
    },
    [applySession]
  );

  const googleLogin = useCallback(
    async (credential: string, role?: Exclude<UserRole, "admin">) => {
      const response = await api.post<{ user: User }>("/auth/google", { credential, role });
      applySession(response.user);
      return response.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // A failed logout request must not keep the client signed in.
    } finally {
      queryClient.setQueryData<MeResponse | null>(["auth", "me"], null);
      queryClient.removeQueries({
        predicate: (query) => !(query.queryKey[0] === "auth" && query.queryKey[1] === "me")
      });
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const data = meQuery.data ?? null;

    return {
      user: data?.user ?? null,
      profile: data?.profile ?? null,
      company: data?.company ?? null,
      isLoading: meQuery.isLoading,
      isAuthenticated: Boolean(data?.user),
      login,
      register,
      googleLogin,
      logout,
      refresh
    };
  }, [meQuery.data, meQuery.isLoading, login, register, googleLogin, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
