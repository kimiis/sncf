const { test, expect } = require("@playwright/test");

/**
 * E2E — Recherche de trajet
 */
test.describe("Recherche de trajet", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/index");
    });

    test("la page principale se charge correctement", async ({ page }) => {
        await expect(page).toHaveTitle(/railgo|sncf/i);
        // Le champ de départ doit être présent
        await expect(
            page.locator('input[placeholder*="départ"], input[placeholder*="Départ"], input[placeholder*="ville"]').first()
        ).toBeVisible();
    });

    test("l'autocomplétion propose des résultats quand on tape une ville", async ({ page }) => {
        const departInput = page
            .locator('input[placeholder*="départ"], input[placeholder*="Départ"]')
            .first();

        await departInput.fill("Par");

        // Attendre les suggestions (liste déroulante)
        const suggestions = page.locator('li, [role="option"], .autocomplete-item').first();
        await expect(suggestions).toBeVisible({ timeout: 5000 });
    });

    test("sélectionner une ville depuis l'autocomplétion remplit le champ", async ({ page }) => {
        const departInput = page
            .locator('input[placeholder*="départ"], input[placeholder*="Départ"]')
            .first();

        await departInput.fill("Par");

        const firstSuggestion = page.locator('li, [role="option"], .autocomplete-item').first();
        await firstSuggestion.waitFor({ timeout: 5000 });
        await firstSuggestion.click();

        // Le champ doit contenir du texte
        const value = await departInput.inputValue();
        expect(value.length).toBeGreaterThan(2);
    });

    test("le formulaire de recherche nécessite une ville de départ et d'arrivée", async ({ page }) => {
        // Soumettre sans remplir les champs
        await page.click('button[type="submit"], button:has-text("Rechercher")');

        // Rester sur la même page (pas de navigation vers /search)
        await expect(page).not.toHaveURL(/\/search/);
    });

    test("une recherche complète navigue vers la page de résultats", async ({ page }) => {
        // Mock de l'API pour éviter les appels réseau réels
        await page.route("**/api/sncf/autocomplete**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(["Paris", "Lyon"]),
            })
        );

        await page.route("**/api/sncf/trajet**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    journeys: [],
                    from: "Paris",
                    to: "Lyon",
                    distance_km: 500,
                    co2_kg: 12,
                }),
            })
        );

        const departInput = page
            .locator('input[placeholder*="départ"], input[placeholder*="Départ"]')
            .first();
        const arriveeInput = page
            .locator('input[placeholder*="arrivée"], input[placeholder*="destination"]')
            .first();

        await departInput.fill("Paris");
        await arriveeInput.fill("Lyon");

        // Sélectionner une date si présente
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible()) {
            await dateInput.fill("2024-12-01");
        }

        await page.click('button[type="submit"], button:has-text("Rechercher")');

        await expect(page).toHaveURL(/\/search/, { timeout: 10000 });
    });
});

test.describe("Page de résultats", () => {
    test("affiche un message si aucun trajet n'est trouvé", async ({ page }) => {
        // Naviguer directement avec des paramètres
        await page.route("**/api/sncf/trajet**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ journeys: [], from: "Paris", to: "Nulle-Part" }),
            })
        );

        await page.goto("/search?from=Paris&to=Nulle-Part&date=2024-12-01");

        await expect(
            page.locator('text=/aucun trajet|pas de trajet|introuvable/i')
        ).toBeVisible({ timeout: 8000 });
    });

    test("les filtres POI sont cliquables", async ({ page }) => {
        await page.route("**/api/sncf/trajet**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    journeys: [
                        {
                            departure_date_time: "2024-12-01T10:00:00",
                            arrival_date_time: "2024-12-01T12:00:00",
                            duration: 7200,
                            sections: [],
                        },
                    ],
                    from: "Paris",
                    to: "Lyon",
                    distance_km: 500,
                    co2_kg: 12,
                }),
            })
        );
        await page.route("**/api/sncf/**", (route) => route.fulfill({ status: 200, body: "[]" }));

        await page.goto("/search?from=Paris&to=Lyon&date=2024-12-01");

        // Attendre les filtres POI (hôtels, vélos, etc.)
        const filterBtn = page.locator('button:has-text("Hôtels"), button:has-text("hotels"), [data-filter]').first();
        if (await filterBtn.isVisible({ timeout: 5000 })) {
            await filterBtn.click();
            // Le bouton doit changer d'état (classe active ou aria-pressed)
            await expect(filterBtn).toHaveClass(/active|selected/, { timeout: 2000 });
        }
    });
});
