import pg from "pg";
import { resetDatabase } from "../support/db";
import { TEST_DB } from "../../playwright.config";

export default async function globalSetup() {
  const admin = new pg.Client({ connectionString: TEST_DB.replace(/\/[^/]+$/, "/postgres") });
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [TEST_DB.split("/").pop()]);
  if (!exists.rowCount) await admin.query(`CREATE DATABASE ${TEST_DB.split("/").pop()}`);
  await admin.end();
  await resetDatabase(TEST_DB);
}
