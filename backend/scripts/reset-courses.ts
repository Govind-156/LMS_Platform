/**
 * Reset all course data: deletes from video_progress, videos, sections,
 * enrollments, payments, and subjects in FK-safe order.
 * Does NOT touch users, refresh_tokens, or auth.
 *
 * Run: npx ts-node scripts/reset-courses.ts
 * Requires DATABASE_URL in backend/.env
 */
import "./load-env";
import { getPool, closePool } from "../src/config/db";

const DELETE_ORDER = [
  { table: "video_progress", description: "Video progress" },
  { table: "videos", description: "Videos (lessons)" },
  { table: "sections", description: "Sections" },
  { table: "payments", description: "Payments" },
  { table: "enrollments", description: "Enrollments" },
  { table: "subjects", description: "Subjects (courses)" },
] as const;

async function run(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is not set. Add it to backend/.env");
    process.exit(1);
  }
  const pool = getPool();
  try {
    for (const { table, description } of DELETE_ORDER) {
      try {
        const res = await pool.query(`DELETE FROM ${table}`);
        const count = res.rowCount ?? 0;
        console.log(`${description} (${table}): ${count} row(s) deleted.`);
      } catch (err) {
        if ((err as { code?: string }).code === "42P01") {
          console.log(`${description} (${table}): table missing, skipped.`);
        } else {
          throw err;
        }
      }
    }
    console.log("Course data reset complete. The system now has zero courses.");
  } catch (err) {
    console.error("Reset failed:", err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

run();
