import { expect, test } from "./helpers";

const PAGES = ["/", "/convertir", "/tarifs", "/cabinets-comptables", "/guides/rapprochement-bancaire", "/inscription", "/outils/verification-solde", "/securite"];

test.describe("responsive / mobile", () => {
  for (const path of PAGES) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("mobile menu opens and navigates", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page.locator("#mobile-menu").getByRole("link", { name: "Tarifs" }).click();
    await expect(page).toHaveURL(/\/tarifs/);
    await expect(page.locator("#mobile-menu")).toHaveCount(0);
  });

  test("converter results use the mobile list", async ({ page }) => {
    await page.goto("/convertir?exemple=1");
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "verified", { timeout: 20_000 });
    await expect(page.getByTestId("transactions-list")).toBeVisible();
    await expect(page.getByTestId("transactions-table")).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
