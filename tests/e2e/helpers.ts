import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { test as base, expect, type Page } from "@playwright/test";
import pg from "pg";
import { TEST_DB } from "../../playwright.config";

export const FIXTURES = path.join(__dirname, "../fixtures/pdf");

export async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const c = new pg.Client({ connectionString: TEST_DB });
  await c.connect();
  try {
    return (await c.query(text, params)).rows as T[];
  } finally {
    await c.end();
  }
}

export function uniqueEmail(prefix = "user") {
  return `${prefix}.${Date.now()}.${randomBytes(3).toString("hex")}@example.com`;
}

export const PASSWORD = "correct horse battery staple";

/** Creates an account through the real API (same-origin request from the page). */
export async function signupViaApi(page: Page, email = uniqueEmail(), { verify = true } = {}) {
  await page.goto("/");
  const res = await page.evaluate(
    async ({ email, password }) => {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, acceptTerms: true }),
      });
      return { status: r.status, body: await r.json() };
    },
    { email, password: PASSWORD },
  );
  expect(res.status).toBe(201);
  if (verify) await sql(`UPDATE users SET email_verified_at = now() WHERE lower(email) = lower($1)`, [email]);
  return email;
}

/** Inserts a known e-mail token (the real one is only sent by e-mail, and stored hashed). */
export async function createEmailToken(email: string, purpose: "verify_email" | "reset_password") {
  const token = randomBytes(32).toString("base64url");
  const [u] = await sql<{ id: string }>(`SELECT id FROM users WHERE lower(email) = lower($1)`, [email]);
  await sql(`DELETE FROM email_tokens WHERE user_id = $1 AND purpose = $2`, [u.id, purpose]);
  await sql(`INSERT INTO email_tokens (id, user_id, purpose, expires_at) VALUES ($1, $2, $3, now() + interval '1 hour')`, [
    createHash("sha256").update(token).digest("hex"),
    u.id,
    purpose,
  ]);
  return token;
}

export async function loadSample(page: Page) {
  await page.goto("/convertir");
  await page.getByRole("button", { name: /relevé d'exemple/i }).click();
  await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "verified", { timeout: 20_000 });
}

export async function uploadFixture(page: Page, name: string) {
  await page.getByTestId("file-input").setInputFiles(path.join(FIXTURES, name));
}

export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource: the server responded with a status of (401|402|403|404|409|422|429)/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

/**
 * Each test gets its own client IP (as a reverse proxy would set it), so that
 * per-IP rate limits behave like in production instead of piling up across tests.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${rand()}.${rand()}.${rand()}` });
    await provide(page);
  },
});

function rand() {
  return Math.floor(Math.random() * 250) + 1;
}

export { expect };
