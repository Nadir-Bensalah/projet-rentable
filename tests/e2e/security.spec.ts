import { createEmailToken, signupViaApi, sql, uniqueEmail, expect, test } from "./helpers";

test.describe("security", () => {
  test("security headers are set", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("connect-src 'self'");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).not.toContain("unsafe-eval");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("state-changing API calls from another origin are refused (CSRF)", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
      data: { email: "a@b.co", password: "x" },
    });
    expect(res.status()).toBe(403);
    const noOrigin = await request.post("/api/auth/logout", { headers: { "Content-Type": "application/json" }, data: {} });
    expect(noOrigin.status()).toBe(403);
  });

  test("protected endpoints require a session", async ({ request, baseURL }) => {
    const origin = { Origin: baseURL! };
    expect((await request.post("/api/usage/consume", { headers: origin, data: { documents: [], format: "xlsx" } })).status()).toBe(401);
    expect((await request.post("/api/billing/checkout", { headers: origin, data: { product: "pack" } })).status()).toBe(401);
    expect((await request.get("/api/account/export")).status()).toBe(401);
    expect((await request.post("/api/account/delete", { headers: origin, data: {} })).status()).toBe(401);
    expect((await request.post("/api/billing/portal", { headers: origin, data: {} })).status()).toBe(401);
  });

  test("webhooks reject unsigned or forged payloads and unknown providers", async ({ request }) => {
    expect((await request.post("/api/webhooks/mock", { data: { payload: {} } })).status()).toBe(400);
    expect((await request.post("/api/webhooks/mock", { headers: { "x-mock-signature": "ab".repeat(32) }, data: { id: "x", payload: { kind: "checkout.completed" } } })).status()).toBe(400);
    expect((await request.post("/api/webhooks/stripe", { data: {} })).status()).toBe(404);
  });

  test("login is rate limited", async ({ request, baseURL }) => {
    const email = `ratelimit.${Date.now()}@example.com`;
    let last = 0;
    for (let i = 0; i < 11; i++) {
      last = (await request.post("/api/auth/login", { headers: { Origin: baseURL! }, data: { email, password: "wrong-password" } })).status();
    }
    expect(last).toBe(429);
  });

  test("input validation rejects malformed documents and oversized bodies", async ({ page }) => {
    await signupViaApi(page);
    const res = await page.evaluate(async () => {
      const bad = await fetch("/api/usage/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: [{ hash: "zz", pages: 1 }], format: "xlsx" }),
      });
      const neg = await fetch("/api/usage/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: [{ hash: "a".repeat(64), pages: -5 }], format: "xlsx" }),
      });
      const big = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.co", topic: "autre", message: "x".repeat(40000) }),
      });
      return [bad.status, neg.status, big.status];
    });
    expect(res).toEqual([422, 422, 413]);
  });

  test("post-login redirect cannot point to another site", async ({ page }) => {
    const email = await signupViaApi(page);
    await page.context().clearCookies();
    await page.goto("/connexion?suite=//evil.example/x");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill("correct horse battery staple");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/localhost:3100\/compte/);
  });

  test("sandbox checkout tokens cannot be reused by another account", async ({ page, browser }) => {
    await signupViaApi(page);
    const url = await page.evaluate(async () => {
      const r = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product: "pack", consent: true }) });
      return (await r.json()).url as string;
    });
    const token = new URL(url, "http://x").searchParams.get("token");
    const other = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": `10.99.${Date.now() % 250}.7` } });
    const p2 = await other.newPage();
    await signupViaApi(p2);
    const status = await p2.evaluate(async (t) => {
      const r = await fetch("/api/billing/mock/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: t, outcome: "paid" }) });
      return r.status;
    }, token);
    expect(status).toBe(403);
    await other.close();
  });

  test("checkout requires the withdrawal-waiver consent, which is recorded", async ({ page }) => {
    const email = await signupViaApi(page);
    const without = await page.evaluate(async () => {
      const r = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product: "pack" }) });
      return r.status;
    });
    expect(without).toBe(422);
    const withConsent = await page.evaluate(async () => {
      const r = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product: "pack", consent: true }) });
      return r.status;
    });
    expect(withConsent).toBe(200);
    const rows = await sql<{ product: string }>(
      `SELECT c.product FROM checkout_consents c JOIN users u ON u.id = c.user_id WHERE u.email = $1`,
      [email],
    );
    expect(rows.map((r) => r.product)).toEqual(["pack"]);
  });

  test("legal pages read the publisher identity at runtime", async ({ page }) => {
    await page.goto("/mentions-legales");
    await expect(page.getByText("Camille Exemple (E2E)").first()).toBeVisible();
  });

  test("cron endpoint requires its secret", async ({ request }) => {
    expect((await request.post("/api/cron/lifecycle")).status()).toBe(401);
    const ok = await request.post("/api/cron/lifecycle", { headers: { Authorization: "Bearer e2e-cron-secret" } });
    expect(ok.status()).toBe(200);
    expect(await ok.json()).toMatchObject({ ok: true });
  });

  test("control characters cannot turn the post-login redirect into another site", async ({ page }) => {
    const email = await signupViaApi(page);
    await page.context().clearCookies();
    await page.goto("/connexion?suite=%2F%09%2Fattacker.invalid%2Fphish");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill("correct horse battery staple");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/localhost:3100\/compte/);
  });

  test("an e-mail verification link never signs the visitor in", async ({ page, browser }) => {
    const email = await signupViaApi(page, uniqueEmail("verifycsrf"), { verify: false });
    const token = await createEmailToken(email, "verify_email");
    const victim = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.77.1.1" } });
    const v = await victim.newPage();
    await v.goto(`/verifier-email?token=${token}`);
    await expect(v.getByText("Adresse confirmée, merci !")).toBeVisible();
    await expect(v.getByRole("link", { name: "Me connecter" })).toBeVisible();
    await v.goto("/compte");
    await expect(v).toHaveURL(/\/connexion/);
    await victim.close();
    const [u] = await sql<{ email_verified_at: Date | null }>(`SELECT email_verified_at FROM users WHERE lower(email) = lower($1)`, [email]);
    expect(u.email_verified_at).not.toBeNull();
  });

  test("analytics from another origin are ignored and bodies are size-capped", async ({ request }) => {
    const before = await sql<{ n: string }>(`SELECT count(*) AS n FROM analytics_events WHERE name = 'checkout_clicked' AND path = '/forged'`);
    await request.post("/api/events", {
      headers: { Origin: "http://evil.example", "Content-Type": "text/plain" },
      data: JSON.stringify({ name: "checkout_clicked", anonId: "x", path: "/forged" }),
    });
    const after = await sql<{ n: string }>(`SELECT count(*) AS n FROM analytics_events WHERE name = 'checkout_clicked' AND path = '/forged'`);
    expect(after[0].n).toBe(before[0].n);
    const big = await request.post("/api/webhooks/mock", { headers: { "x-mock-signature": "00" }, data: "x".repeat(600 * 1024) });
    expect(big.status()).toBe(413);
  });

  test("login lockout by a third party does not block the owner", async ({ page, request, baseURL }) => {
    const email = await signupViaApi(page, uniqueEmail("lockout"));
    for (let i = 0; i < 12; i++) {
      await request.post("/api/auth/login", {
        headers: { Origin: baseURL!, "x-forwarded-for": `10.66.0.${i + 1}` },
        data: { email, password: "wrong-password!" },
      });
    }
    await page.context().clearCookies();
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill("correct horse battery staple");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/compte/);
  });
});
