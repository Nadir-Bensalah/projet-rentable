import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { env } from "@/lib/env";

declare global {
  var __releveoPool: Pool | undefined;
}

function createPool() {
  const e = env();
  return new Pool({
    connectionString: e.DATABASE_URL,
    ssl: e.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function pool(): Pool {
  // Reuse the pool across hot reloads in development.
  if (!globalThis.__releveoPool) globalThis.__releveoPool = createPool();
  return globalThis.__releveoPool;
}

/** Parameterised query helper. Never interpolate user input into SQL strings. */
export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool().query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export type Tx = Pick<PoolClient, "query">;

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
