import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      login: async (email, password) => {
        const { api } = await import("@/lib/api");
        try {
          const { data } = await api.post<{
            user: User;
            accessToken: string;
          }>("/auth/login", { email, password });
          set({ user: data.user, accessToken: data.accessToken });
          return { ok: true };
        } catch (err: unknown) {
          return { ok: false, error: getApiErrorMessage(err, "Login failed") };
        }
      },
      register: async (email, password, name) => {
        const { api } = await import("@/lib/api");
        try {
          await api.post("/auth/register", { email, password, name });
          return { ok: true };
        } catch (err: unknown) {
          return { ok: false, error: getApiErrorMessage(err, "Registration failed") };
        }
      },
      logout: async () => {
        const { api } = await import("@/lib/api");
        try {
          await api.post("/auth/logout");
        } finally {
          set({ user: null, accessToken: null });
        }
      },
    }),
    {
      name: "lms-auth",
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    }
  )
);

// Derived selector for components (persist rehydrates async, so we need a getter)
export function useIsAuthenticated(): boolean {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  return !!user && !!accessToken;
}
