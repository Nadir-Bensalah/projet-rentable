import fs from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import { PASSWORD, loadSample, signupViaApi, sql, uniqueEmail, expect, test } from "./helpers";

test.describe("export, paywall and payments", () => {
  test("anonymous user signs up in the dialog, confirms e-mail and gets the Excel file", async ({ page }) => {
    await loadSample(page);
    await page.getByTestId("export-button").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Créez votre compte gratuit");
    const email = uniqueEmail("dialog");
    await dialog.getByLabel("Adresse e-mail").fill(email);
    await dialog.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
    await dialog.getByRole("checkbox").first().check();
    await dialog.getByRole("button", { name: "Créer mon compte gratuit" }).click();
    await expect(page.getByRole("dialog")).toContainText("Confirmez votre adresse e-mail");
    // The user clicks the link in the e-mail (simulated): the waiting tab resumes by itself.
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await sql(`UPDATE users SET email_verified_at = now() WHERE lower(email) = lower($1)`, [email]);
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("releve-exemple.xlsx");
    const file = fs.readFileSync((await download.path())!);
    const sheet = strFromU8(unzipSync(new Uint8Array(file))["xl/worksheets/sheet1.xml"]);
    expect(sheet).toContain("CARTE X4821");
    await expect(page.getByText(/2 pages décomptées/)).toBeVisible();
    await expect(page.getByTestId("quota")).toContainText("13 pages restantes");
    // Re-export in CSV: free.
    await page.getByRole("radio", { name: /CSV \(Excel France\)/ }).check();
    const d2 = page.waitForEvent("download");
    await page.getByTestId("export-button").click();
    expect((await d2).suggestedFilename()).toBe("releve-exemple.csv");
    await expect(page.getByText(/ce nouvel export est gratuit/)).toBeVisible();
  });

  test("paid format → paywall → pack purchase (sandbox) → OFX export with restored workspace", async ({ page }) => {
    await signupViaApi(page);
    await loadSample(page);
    await page.getByRole("radio", { name: /^OFX/ }).check();
    await page.getByTestId("export-button").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Ce format est inclus dans les offres payantes");
    // The withdrawal-waiver consent is required before the payment page.
    await dialog.getByRole("button", { name: "Choisir" }).first().click();
    await expect(dialog.getByText("Cochez cette case pour continuer")).toBeVisible();
    await dialog.getByLabel(/Je demande l'accès immédiat/).check();
    await dialog.getByRole("button", { name: "Choisir" }).first().click();
    await expect(page).toHaveURL(/\/paiement\/simulation/);
    await expect(page.getByText("Pack 150 pages")).toBeVisible();
    // A refused payment keeps the user on the page with a clear message.
    await page.getByTestId("mock-fail").click();
    await expect(page.getByText(/Paiement refusé/)).toBeVisible();
    await page.getByTestId("mock-pay").click();
    await expect(page).toHaveURL(/\/compte\/abonnement\?paiement=succes/);
    await expect(page.getByText("Merci, votre paiement est confirmé")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Pack 150 pages" })).toBeVisible();
    await page.getByRole("link", { name: "Reprendre ma conversion" }).click();
    await expect(page.getByTestId("reconciliation")).toHaveAttribute("data-status", "verified");
    await expect(page.getByTestId("quota")).toContainText("+ 150 en crédit");
    await page.getByRole("radio", { name: /^OFX/ }).check();
    const download = page.waitForEvent("download");
    await page.getByTestId("export-button").click();
    const d = await download;
    expect(d.suggestedFilename()).toBe("releve-exemple.ofx");
    const ofx = fs.readFileSync((await d.path())!, "utf8");
    expect(ofx).toContain("<OFX>");
    expect(ofx.match(/<STMTTRN>/g)).toHaveLength(46);
  });

  test("subscription lifecycle through the sandbox portal", async ({ page }) => {
    await signupViaApi(page);
    await page.goto("/tarifs");
    await page.getByLabel(/Je demande l'accès immédiat/).check();
    await page.getByRole("button", { name: "Choisir Pro" }).click();
    await expect(page).toHaveURL(/\/paiement\/simulation/);
    await page.getByTestId("mock-pay").click();
    await expect(page).toHaveURL(/\/compte\/abonnement/);
    await expect(page.getByText("Pro", { exact: true })).toBeVisible();
    await expect(page.getByText("Actif", { exact: true })).toBeVisible();
    // Buying a second subscription is refused, the button leads to management.
    await page.goto("/tarifs");
    await expect(page.getByRole("button", { name: "Gérer mon abonnement" }).first()).toBeVisible();
    await page.goto("/compte/abonnement");
    await page.getByRole("button", { name: /Gérer ou résilier/ }).click();
    await page.getByTestId("mock-cancel-sub").click();
    await expect(page).toHaveURL(/\/compte\/abonnement/);
    await expect(page.getByText("Résiliation programmée")).toBeVisible();
    await expect(page.getByText(/Accès jusqu'au/)).toBeVisible();
    await page.getByRole("button", { name: /Gérer ou résilier/ }).click();
    await page.getByTestId("mock-resume").click();
    await expect(page.getByText("Actif", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Gérer ou résilier/ }).click();
    await page.getByTestId("mock-fail-renewal").click();
    await expect(page.getByText("Paiement en attente")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mettre à jour le paiement" })).toBeVisible();
  });

  test("merged export of several statements requires a paid plan and works with one", async ({ page }) => {
    await signupViaApi(page);
    await page.goto("/convertir");
    await page.getByTestId("file-input").setInputFiles(["tests/fixtures/pdf/fr-dotted-dates.pdf", "tests/fixtures/pdf/fr-no-header-running-balance.pdf"]);
    await expect(page.getByRole("tab")).toHaveCount(2);
    await expect(page.getByRole("tab").nth(1)).not.toContainText("…");
    await page.getByRole("radio", { name: /fusionnés/ }).check({ timeout: 20_000 });
    await page.getByTestId("export-button").click();
    await expect(page.getByRole("dialog")).toContainText("plusieurs relevés");
    await page.getByRole("dialog").getByRole("button", { name: "Fermer" }).click();
    // Grant credits directly (as a pack purchase would) and retry.
    const [u] = await sql<{ id: string }>(`SELECT id FROM users ORDER BY created_at DESC LIMIT 1`);
    await sql(`INSERT INTO credit_grants (user_id, pages, remaining, source, reference) VALUES ($1, 50, 50, 'admin', $2)`, [u.id, `e2e-${Date.now()}`]);
    await page.reload();
    await page.getByRole("radio", { name: /fusionnés/ }).check();
    const download = page.waitForEvent("download");
    await page.getByTestId("export-button").click();
    const d = await download;
    expect(d.suggestedFilename()).toMatch(/^releves-fusionnes-.*\.xlsx$/);
  });
});
