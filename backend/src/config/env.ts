const env = process.env;
const isProduction = env.NODE_ENV === "production";

export const config = {
  port: parseInt(env.PORT ?? "3001", 10),
  nodeEnv: env.NODE_ENV ?? "development",
  /** PostgreSQL connection string (e.g. Supabase URI from Project Settings → Database). */
  databaseUrl: env.DATABASE_URL ?? "",
  jwtSecret: env.JWT_SECRET ?? "change-me-in-production",
  jwtAccessExpiresIn: "15m",
  refreshTokenExpiresInDays: 30,
  cookieName: "refreshToken",
  /** Frontend origin for CORS (e.g. https://your-app.vercel.app). Required in production. */
  corsOrigin: env.CORS_ORIGIN ?? env.FRONTEND_ORIGIN ?? "",
  /** Optional cookie domain (e.g. .your-api.com). Leave unset to use response host. */
  cookieDomain: env.COOKIE_DOMAIN ?? undefined,
  get cookieOptions() {
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction && this.corsOrigin ? "none" : "strict") as "strict" | "none" | "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
      path: "/api/auth",
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    };
  },
  /** Groq API key for AI tutor (required for /api/ai/chat). */
  groqApiKey: env.GROQ_API_KEY ?? "",
  /** Groq model name (default: llama-3.3-70b-versatile). */
  groqModel: env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
};
