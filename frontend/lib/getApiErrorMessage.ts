/**
 * Get a user-friendly message from an API (axios) error.
 * Use for login, register, and other API calls so users see the real failure reason.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object" || !("response" in err)) {
    const msg = err instanceof Error ? err.message : "";
    if (typeof (err as { code?: string }).code === "string" && (err as { code: string }).code === "ERR_NETWORK") {
      return "Cannot reach server. Is the backend running? Check NEXT_PUBLIC_API_BASE_URL (e.g. http://localhost:3001/api).";
    }
    return msg && msg.length < 120 ? msg : fallback;
  }
  const res = (err as { response?: { data?: { error?: string }; status?: number } }).response;
  if (res?.data?.error && typeof res.data.error === "string") {
    return res.data.error;
  }
  if (res?.status === 404) return "Not found.";
  if (res?.status === 500) return "Server error. Check backend logs.";
  return fallback;
}
