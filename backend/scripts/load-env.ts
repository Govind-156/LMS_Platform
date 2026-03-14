/**
 * Load .env into process.env before any app code runs (so config sees DATABASE_URL).
 * Import this first in scripts that need env (e.g. run-migrations, test-db).
 */
import { readFileSync } from "fs";
import { join } from "path";

function loadEnvFile(envPath: string): void {
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
  } catch {
    // skip
  }
}

loadEnvFile(join(process.cwd(), ".env"));
loadEnvFile(join(__dirname, "..", ".env"));
