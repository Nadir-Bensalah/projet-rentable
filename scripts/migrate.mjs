// Applies SQL migrations in order. Usage: DATABASE_URL=... node scripts/migrate.mjs
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "migrations");
const client = new pg.Client({
  connectionString: url,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});
await client.connect();
try {
  await client.query("SELECT pg_advisory_lock(727274)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const done = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    const sql = fs.readFileSync(path.join(dir, f), "utf8");
    process.stdout.write(`Applying ${f}... `);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [f]);
      await client.query("COMMIT");
      console.log("ok");
    } catch (e) {
      await client.query("ROLLBACK");
      console.log("failed");
      throw e;
    }
  }
  console.log("Database is up to date.");
} finally {
  await client.query("SELECT pg_advisory_unlock(727274)").catch(() => {});
  await client.end();
}
