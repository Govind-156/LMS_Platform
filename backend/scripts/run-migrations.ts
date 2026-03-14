/**
 * Run SQL migrations from backend/migrations.
 * Usage: npx ts-node scripts/run-migrations.ts
 * Requires DATABASE_URL in backend/.env or in the environment.
 */
import "./load-env";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { getPool, closePool } from "../src/config/db";

const MIGRATIONS_DIR = join(__dirname, "..", "migrations");

function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) =>
      s
        .split(/\r?\n/)
        .filter((line) => {
          const t = line.trim();
          return t.length > 0 && !t.startsWith("--");
        })
        .join("\n")
        .trim()
    )
    .filter((s) => s.length > 0);
}

async function run(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is not set. Add it to backend/.env or set the environment variable.");
    process.exit(1);
  }
  const pool = getPool();
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    console.log(`Running ${file}...`);
    const path = join(MIGRATIONS_DIR, file);
    const sql = readFileSync(path, "utf-8");
    const statements = splitStatements(sql);
    for (const statement of statements) {
      await pool.query(statement);
    }
    console.log(`  Done: ${file}`);
  }
  await closePool();
  console.log("Migrations complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
