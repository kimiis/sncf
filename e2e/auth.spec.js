const { test, expect } = require("@playwright/test");

/**
 * E2E — Authentification
 *
 * Ces tests supposent que le backend tourne sur :8000 et qu'il y a
 * un compte test : test@railgo.fr / Test1234!
 * Configurez RAILGO_TEST_EMAIL et RAILGO_TEST_PASSWORD dans votre .env e2e.
 */
const EMAIL = process.env.RAILGO_TEST_EMAIL || "test@railgo.fr";
const PASSWORD = process.env.RAILGO_TEST_PASSWORD || "Test1234!";

test.describe("Authentification", () => {
    test.beforeEach(async ({ page }) => {
        // Nettoyer le localStorage avant chaque test
        await page.goto("/index");
        await page.evaluate(() => localStorage.clear());
    });

    test("ouvre la modal de connexion en cliquant sur le bouton connexion", async ({ page }) => {
        await page.goto("/index");

        // Clic sur le bouton de connexion dans la navbar
        await page.click('[data-testid="btn-connexion"], button:has-text("Connexion"), button:has-text("Se connecter")');

        await expect(page.locator(".auth-modal")).toBeVisible();
        await expect(page.locator("h2")).toContainText(/se connecter/i);
    });

    test("connexion réussie — le token est stocké dans localStorage", async ({ page }) => {
        await page.goto("/index");

        // Ouvrir la modal
        await page.click('button:has-text("Connexion"), button:has-text("Se connecter")');

        // Remplir le formulaire
        await page.fill('input[type="email"]', EMAIL);
        await page.fill('input[type="password"]', PASSWORD);
        await page.click('button[type="submit"]');

        // Attendre la fermeture de la modal
        await expect(page.locator(".auth-modal")).not.toBeVisible({ timeout: 5000 });

        // Vérifier que le token est dans localStorage
        const token = await page.evaluate(() => localStorage.getItem("token"));
        expect(token).not.toBeNull();
        expect(token.split(".").length).toBe(3); // format JWT
    });

    test("connexion échouée avec de mauvais identifiants — affiche une alerte", async ({ page }) => {
        await page.goto("/index");

        // Intercepter les alertes
        const alertMessages = [];
        page.on("dialog", async (dialog) => {
            alertMessages.push(dialog.message());
            await dialog.accept();
        });

        await page.click('button:has-text("Connexion"), button:has-text("Se connecter")');
        await page.fill('input[type="email"]', "mauvais@email.com");
        await page.fill('input[type="password"]', "mauvaismdp");
        await page.click('button[type="submit"]');

        await page.waitForTimeout(1000);

        expect(alertMessages.length).toBeGreaterThan(0);
    });

    test("bascule en mode inscription", async ({ page }) => {
        await page.goto("/index");
        await page.click('button:has-text("Connexion"), button:has-text("Se connecter")');

        // Clic sur le lien "S'inscrire"
        await page.click('button:has-text("S\'inscrire")');

        await expect(page.locator("h2")).toContainText(/inscription/i);
        await expect(page.locator('input[placeholder="Nom"]')).toBeVisible();
        await expect(page.locator('input[placeholder="Prénom"]')).toBeVisible();
    });

    test("ferme la modal en cliquant sur l'overlay", async ({ page }) => {
        await page.goto("/index");
        await page.click('button:has-text("Connexion"), button:has-text("Se connecter")');

        await expect(page.locator(".auth-modal")).toBeVisible();

        // Clic sur l'overlay (en dehors de la modal)
        await page.click(".auth-modal-overlay", { position: { x: 5, y: 5 } });

        await expect(page.locator(".auth-modal")).not.toBeVisible();
    });

    test("accès à /profil sans connexion redirige vers /login", async ({ page }) => {
        await page.goto("/profil");

        // On doit être redirigé
        await expect(page).toHaveURL(/\/login/);
    });
});
