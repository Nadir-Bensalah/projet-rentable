import { execFileSync } from "node:child_process";
import path from "node:path";
import pg from "pg";

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:5432/releveo_test";

/** Drops and recreates the schema, then applies migrations. */
export async function resetDatabase(url = TEST_DATABASE_URL) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
  await client.end();
  execFileSync("node", [path.join(__dirname, "../../scripts/migrate.mjs")], { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
}
