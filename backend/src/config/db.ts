import { Pool } from "pg";
import { config } from "./env";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    if (!config.databaseUrl) {
      throw new Error("DATABASE_URL is not set");
    }
    const useSsl =
      process.env.NODE_ENV === "production" ||
      config.databaseUrl.includes("supabase");
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: useSsl
        ? { rejectUnauthorized: false }
        : false,
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
