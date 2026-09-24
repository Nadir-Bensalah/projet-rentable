import fs from "node:fs";
import { PASSWORD, createEmailToken, signupViaApi, sql, uniqueEmail, expect, test } from "./helpers";

test.describe("authentication and account", () => {
  test("signup page validates, creates the account and welcomes the user", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: "Créer mon compte gratuit" }).click();
    await expect(page.getByText("Saisissez une adresse e-mail valide.")).toBeVisible();
    await expect(page.getByText("Vous devez accepter les conditions")).toBeVisible();
    const email = uniqueEmail("signup");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill("password12");
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Créer mon compte gratuit" }).click();
    await expect(page.getByText(/trop courant/)).toBeVisible();
    await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Créer mon compte gratuit" }).click();
    await expect(page).toHaveURL(/\/convertir\?bienvenue=1/);
    await expect(page.getByText(/Compte créé/)).toBeVisible();
    // Same e-mail again → clear message.
    await page.context().clearCookies();
    await page.goto("/inscription");
    await page.getByLabel("Adresse e-mail").fill(email.toUpperCase());
    await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Créer mon compte gratuit" }).click();
    await expect(page.getByText(/Un compte existe déjà/)).toBeVisible();
  });

  test("e-mail verification link works once", async ({ page }) => {
    const email = await signupViaApi(page, uniqueEmail("verify"), { verify: false });
    await page.goto("/compte");
    await expect(page.getByText("Confirmez votre adresse e-mail")).toBeVisible();
    const token = await createEmailToken(email, "verify_email");
    await page.goto(`/verifier-email?token=${token}`);
    await expect(page.getByText("Adresse confirmée, merci !")).toBeVisible();
    await page.goto("/compte");
    await expect(page.getByText("Confirmez votre adresse e-mail")).toHaveCount(0);
    await page.goto(`/verifier-email?token=${token}`);
    await expect(page.getByText(/invalide ou a expiré/)).toBeVisible();
  });

  test("login, wrong password, logout and protected pages", async ({ page }) => {
    const email = await signupViaApi(page, uniqueEmail("login"));
    await page.context().clearCookies();
    await page.goto("/compte");
    await expect(page).toHaveURL(/\/connexion\?suite=%2Fcompte|\/connexion\?suite=\/compte/);
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill("wrong password!!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
    await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/compte$/);
    await expect(page.getByRole("heading", { name: "Mon compte" })).toBeVisible();
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/compte/parametres");
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("forgot + reset password signs out other sessions", async ({ page, browser }) => {
    const email = await signupViaApi(page, uniqueEmail("reset"));
    const other = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": `10.99.${Date.now() % 250}.7` } });
    const otherPage = await other.newPage();
    await otherPage.goto("/connexion");
    await otherPage.getByLabel("Adresse e-mail").fill(email);
    await otherPage.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
    await otherPage.getByRole("button", { name: "Se connecter" }).click();
    await expect(otherPage).toHaveURL(/\/compte/);

    await page.context().clearCookies();
    await page.goto("/mot-de-passe-oublie");
    await page.getByLabel("Adresse e-mail du compte").fill(email);
    await page.getByRole("button", { name: "Recevoir un lien" }).click();
    await expect(page.getByText("Vérifiez votre boîte de réception")).toBeVisible();
    const token = await createEmailToken(email, "reset_password");
    await page.goto(`/reinitialiser-mot-de-passe?token=${token}`);
    await page.getByLabel("Nouveau mot de passe").fill("a brand new passphrase");
    await page.getByLabel("Confirmer le mot de passe").fill("a different one here");
    await page.getByRole("button", { name: "Enregistrer et me connecter" }).click();
    await expect(page.getByText("ne correspondent pas")).toBeVisible();
    await page.getByLabel("Confirmer le mot de passe").fill("a brand new passphrase");
    await page.getByRole("button", { name: "Enregistrer et me connecter" }).click();
    await expect(page).toHaveURL(/\/compte\?motdepasse=modifie/);
    await otherPage.goto("/compte");
    await expect(otherPage).toHaveURL(/\/connexion/);
    await other.close();
  });

  test("profile, data export and account deletion", async ({ page }) => {
    const email = await signupViaApi(page, uniqueEmail("delete"));
    await page.goto("/compte/parametres");
    await page.getByLabel("Nom (facultatif)").fill("Camille Test");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Modifications enregistrées.")).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: /Exporter mes données/ }).click();
    const json = JSON.parse(fs.readFileSync((await (await download).path())!, "utf8"));
    expect(json.user.email).toBe(email);
    expect(json.user.name).toBe("Camille Test");
    expect(json.user.password_hash).toBeUndefined();
    const del = page.getByRole("button", { name: "Supprimer définitivement mon compte" });
    await expect(del).toBeDisabled();
    await page.getByLabel("Mot de passe", { exact: true }).last().fill("wrong password!!");
    await page.getByLabel(/Tapez SUPPRIMER/).fill("SUPPRIMER");
    await del.click();
    await expect(page.getByText("Mot de passe incorrect.")).toBeVisible();
    await page.locator("#del-password").fill(PASSWORD);
    await del.click();
    await expect(page).toHaveURL(/\/\?compte=supprime/);
    expect(await sql(`SELECT 1 FROM users WHERE lower(email) = lower($1)`, [email])).toHaveLength(0);
  });

  test("admin dashboard is hidden from regular users and shown to admins", async ({ page }) => {
    await signupViaApi(page, uniqueEmail("notadmin"));
    const res = await page.goto("/admin");
    expect(res?.status()).toBe(404);
    await page.context().clearCookies();
    const existing = await sql(`SELECT 1 FROM users WHERE email = 'admin@example.com'`);
    if (!existing.length) await signupViaApi(page, "admin@example.com");
    else {
      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill("admin@example.com");
      await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/compte/);
    }
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
    await expect(page.getByText("Entonnoir")).toBeVisible();
  });
});
