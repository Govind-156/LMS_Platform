/**
 * Test database connection (e.g. Supabase PostgreSQL).
 * Usage: npx ts-node scripts/test-db.ts
 * Requires DATABASE_URL in backend/.env or in the environment.
 */
import "./load-env";
import { getPool, closePool } from "../src/config/db";

async function run(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const pool = getPool();
  try {
    const result = await pool.query("SELECT 1 AS ok");
    console.log("Connection OK:", result.rows);
    try {
      const usersResult = await pool.query("SELECT COUNT(*)::int AS n FROM users");
      const subjectsResult = await pool.query("SELECT COUNT(*)::int AS n FROM subjects");
      console.log("Users count:", usersResult.rows[0]);
      console.log("Subjects count:", subjectsResult.rows[0]);
    } catch {
      console.log("Tables not yet created (run npm run migrate first).");
    }
    console.log("Database test passed.");
  } catch (err) {
    console.error("Database test failed:", err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

run();
