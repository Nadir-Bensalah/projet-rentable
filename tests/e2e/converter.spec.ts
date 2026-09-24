import { collectErrors, loadSample, uploadFixture, expect, test } from "./helpers";

test.describe("converter (anonymous)", () => {
  test("landing page leads to a verified conversion of the sample", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("vérifiés au centime");
    await page.getByRole("link", { name: /Voir avec un exemple/ }).click();
    await expect(page).toHaveURL(/\/convertir\?exemple=1/);
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "verified", { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /46 opérations/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("editing a row breaks then restores the reconciliation", async ({ page }) => {
    await loadSample(page);
    const table = page.getByTestId("transactions-table");
    const firstRow = table.locator("tbody tr").first();
    await firstRow.getByRole("button", { name: /Inverser le sens/ }).click();
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "mismatch");
    await expect(page.getByTestId("reconciliation")).toContainText("Écart de");
    await table.locator("tbody tr").first().getByRole("button", { name: /Inverser le sens/ }).click();
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "verified");
    // Exclude a row → mismatch; include again → verified.
    await table.locator("tbody tr").nth(2).getByRole("checkbox").uncheck();
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "mismatch");
    await table.locator("tbody tr").nth(2).getByRole("checkbox").check();
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "verified");
  });

  test("edit a cell with validation", async ({ page }) => {
    await loadSample(page);
    const row = page.getByTestId("transactions-table").locator("tbody tr").first();
    await row.getByRole("button", { name: /Modifier/ }).click();
    const amount = page.getByLabel(/Montant \(négatif pour un débit\)/);
    await amount.fill("abc");
    await page.getByRole("button", { name: "Enregistrer la ligne" }).click();
    await expect(page.getByText(/Montant invalide/)).toBeVisible();
    await amount.fill("-1,00");
    await page.getByRole("button", { name: "Enregistrer la ligne" }).click();
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "mismatch");
  });

  test("uploads several real PDFs and reports each result", async ({ page }) => {
    await page.goto("/convertir");
    await page.getByTestId("file-input").setInputFiles([
      "tests/fixtures/pdf/en-us-running-balance.pdf",
      "tests/fixtures/pdf/fr-mismatch.pdf",
      "tests/fixtures/pdf/scanned.pdf",
    ]);
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    await tabs.nth(0).click();
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "verified", { timeout: 20_000 });
    await tabs.nth(1).click();
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "mismatch", { timeout: 20_000 });
    await expect(page.getByTestId("reconciliation")).toContainText("Écart de 10,00");
    await tabs.nth(2).click();
    await expect(page.getByText(/document scanné/)).toBeVisible({ timeout: 20_000 });
  });

  test("rejects non-PDF files and unverifiable statements can be completed by hand", async ({ page }) => {
    await page.goto("/convertir");
    await page.getByTestId("file-input").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.getByText(/n'est pas un PDF/)).toBeVisible();
    await page.getByTestId("file-input").setInputFiles({ name: "broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("not really a pdf") });
    await expect(page.getByText(/pas un PDF valide/)).toBeVisible({ timeout: 20_000 });
  });

  test("workspace survives a reload (session storage only)", async ({ page }) => {
    await loadSample(page);
    await page.reload();
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "verified");
    await page.getByRole("button", { name: "Tout effacer" }).click();
    await expect(page.getByText("Déposez vos relevés bancaires PDF ici")).toBeVisible();
    await page.reload();
    await expect(page.getByText("Déposez vos relevés bancaires PDF ici")).toBeVisible();
  });

  test("the statement is never uploaded", async ({ page }) => {
    const bodies: string[] = [];
    page.on("request", (r) => {
      if (r.method() !== "GET") bodies.push(`${r.url()} ${r.postData()?.length ?? 0}`);
    });
    await page.goto("/convertir");
    await uploadFixture(page, "fr-debit-credit.pdf");
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "verified", { timeout: 20_000 });
    // Only small analytics beacons may be sent, never the PDF (38 KB) nor its content.
    for (const b of bodies) {
      expect(b).toMatch(/\/api\/events/);
      expect(Number(b.split(" ").pop())).toBeLessThan(2000);
    }
  });
});
