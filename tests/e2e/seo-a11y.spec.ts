import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers";

const PAGES = [
  "/",
  "/convertir",
  "/tarifs",
  "/cabinets-comptables",
  "/securite",
  "/comparatif",
  "/guides",
  "/guides/convertir-releve-bancaire-pdf-excel",
  "/guides/rapprochement-bancaire",
  "/formats/excel",
  "/formats/ecritures-comptables",
  "/outils/verification-solde",
  "/outils/modele-rapprochement-bancaire",
  "/parrainage",
  "/contact",
  "/inscription",
  "/connexion",
  "/mentions-legales",
  "/confidentialite",
  "/cgv",
];

test.describe("SEO", () => {
  for (const path of PAGES) {
    test(`metadata on ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThanOrEqual(75);
      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      expect(desc && desc.length).toBeGreaterThan(50);
      expect(desc!.length).toBeLessThanOrEqual(175);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical?.replace(/\/$/, "")).toBe(`http://localhost:3100${path === "/" ? "" : path}`);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await page.locator('meta[property="og:title"]').count()).toBeGreaterThan(0);
    });
  }

  test("titles and descriptions are unique", async ({ page }) => {
    const titles = new Map<string, string>();
    const descs = new Map<string, string>();
    for (const path of PAGES) {
      await page.goto(path);
      const t = await page.title();
      const d = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
      expect(titles.get(t), `duplicate title ${t}`).toBeUndefined();
      expect(descs.get(d), `duplicate description on ${path}`).toBeUndefined();
      titles.set(t, path);
      descs.set(d, path);
    }
  });

  test("sitemap, robots, structured data and 404", async ({ page, request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("<loc>http://localhost:3100/guides/rapprochement-bancaire</loc>");
    expect(sitemap).not.toContain("/compte");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace("http://localhost:3100", ""));
    for (const u of urls) expect((await request.get(u || "/")).status(), u).toBe(200);
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap: http://localhost:3100/sitemap.xml");
    await page.goto("/");
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = ld.flatMap((t) => [JSON.parse(t)].flat().map((o: { "@type": string }) => o["@type"]));
    expect(types).toEqual(expect.arrayContaining(["SoftwareApplication", "Organization", "FAQPage"]));
    const res = await page.goto("/cette-page-nexiste-pas");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Cette page n'existe pas")).toBeVisible();
    expect((await request.get("/opengraph-image")).headers()["content-type"]).toContain("image/png");
  });

  test("private pages are not indexable", async ({ request }) => {
    const res = await request.get("/paiement/simulation");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("accessibility (axe, WCAG 2.1 AA)", () => {
  for (const path of ["/", "/convertir", "/tarifs", "/inscription", "/guides/rapprochement-bancaire", "/outils/verification-solde", "/contact", "/cookies"]) {
    test(`no serious violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page: page as never }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }

  test("converter with results is accessible, in dark mode too", async ({ page }) => {
    await page.goto("/convertir?exemple=1");
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "verified", { timeout: 20_000 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      const results = await new AxeBuilder({ page: page as never }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    }
  });

  test("keyboard: skip link and dialog focus", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
    await page.goto("/convertir?exemple=1");
    await expect(page.getByTestId("reconciliation")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("export-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
