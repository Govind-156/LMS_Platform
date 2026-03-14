"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { setupAuthInterceptors } from "@/lib/setupAuthInterceptors";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    setupAuthInterceptors(
      api,
      () => useAuthStore.getState().accessToken,
      (user, accessToken) => useAuthStore.getState().setAuth(user, accessToken),
      () => useAuthStore.getState().clearAuth(),
      () => router.push("/login")
    );
  }, [router]);

  return <>{children}</>;
}
