import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type { User } from "@/types";

type GetToken = () => string | null;
type SetAuth = (user: User, accessToken: string) => void;
type ClearAuth = () => void;
type OnRefreshFail = () => void;

let refreshPromise: Promise<string | null> | null = null;

export function setupAuthInterceptors(
  api: AxiosInstance,
  getToken: GetToken,
  setAuth: SetAuth,
  clearAuth: ClearAuth,
  onRefreshFail: OnRefreshFail
): void {
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      // If the failing request was refresh itself, do not retry—clear auth and redirect to login
      const isRefreshRequest =
        typeof originalRequest?.url === "string" && originalRequest.url.includes("/auth/refresh");
      if (isRefreshRequest) {
        clearAuth();
        onRefreshFail();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const res = await api.post<{ user: User; accessToken: string }>("/auth/refresh");
            setAuth(res.data.user, res.data.accessToken);
            return res.data.accessToken;
          } catch {
            return null;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api.request(originalRequest);
      }

      clearAuth();
      onRefreshFail();
      return Promise.reject(error);
    }
  );
}
