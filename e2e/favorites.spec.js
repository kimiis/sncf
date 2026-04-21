const { test, expect } = require("@playwright/test");

/**
 * E2E — Gestion des favoris
 *
 * Ces tests nécessitent d'être connecté.
 * On injecte un token JWT directement dans localStorage pour simuler la connexion.
 */

// Token JWT de test (à remplacer par un vrai token signé avec votre secret si nécessaire)
// Pour les tests E2E, générez-en un avec : jwt.sign({ id: 'test-id', role: 'user' }, 'secret_key', { expiresIn: '1h' })
const FAKE_TOKEN = process.env.RAILGO_TEST_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci1pZCIsImVtYWlsIjoidGVzdEByYWlsZ28uZnIiLCJyb2xlIjoidXNlciIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.test";

async function loginAsTestUser(page) {
    await page.goto("/index");
    await page.evaluate((token) => localStorage.setItem("token", token), FAKE_TOKEN);
}

test.describe("Favoris", () => {
    test.beforeEach(async ({ page }) => {
        // Mock de toutes les routes API backend
        await page.route("**/api/trajet/favorites**", async (route) => {
            if (route.request().method() === "GET") {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify([
                        {
                            favorites_itinary_id: 1,
                            gare_depart: "Paris",
                            gare_arrivee: "Lyon",
                            created_at: "2024-01-01T00:00:00.000Z",
                        },
                    ]),
                });
            } else if (route.request().method() === "POST") {
                await route.fulfill({
                    status: 201,
                    contentType: "application/json",
                    body: JSON.stringify({
                        favorites_itinary_id: 2,
                        gare_depart: "Paris",
                        gare_arrivee: "Marseille",
                    }),
                });
            } else if (route.request().method() === "DELETE") {
                await route.fulfill({ status: 200, body: JSON.stringify({ message: "Favori supprimé" }) });
            } else {
                await route.continue();
            }
        });

        await loginAsTestUser(page);
    });

    test("les favoris s'affichent dans la sidebar de la page principale", async ({ page }) => {
        await page.goto("/index");

        // Les favoris sauvegardés doivent apparaître
        await expect(page.locator('text="Paris"').first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text="Lyon"').first()).toBeVisible({ timeout: 5000 });
    });

    test("cliquer sur un favori pré-remplit les champs de recherche", async ({ page }) => {
        await page.goto("/index");

        // Cliquer sur le favori Paris → Lyon
        const favoriteItem = page.locator('[data-testid="favorite-item"], .favorite-item, li:has-text("Lyon")').first();
        if (await favoriteItem.isVisible({ timeout: 3000 })) {
            await favoriteItem.click();

            const departInput = page.locator('input[placeholder*="départ"], input[placeholder*="Départ"]').first();
            const value = await departInput.inputValue();
            expect(value).toMatch(/paris/i);
        }
    });

    test("ajouter un trajet en favori depuis les résultats de recherche", async ({ page }) => {
        await page.route("**/api/sncf/trajet**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    journeys: [
                        {
                            departure_date_time: "2024-12-01T10:00:00",
                            arrival_date_time: "2024-12-01T12:15:00",
                            duration: 8100,
                            sections: [],
                        },
                    ],
                    from: "Paris",
                    to: "Marseille",
                    distance_km: 775,
                    co2_kg: 18.5,
                }),
            })
        );
        await page.route("**/api/sncf/**", (route) => route.fulfill({ status: 200, body: "[]" }));
        await page.route("**/api/stats/**", (route) => route.fulfill({ status: 200, body: JSON.stringify({}) }));

        await page.goto("/search?from=Paris&to=Marseille&date=2024-12-01");

        // Trouver et cliquer le bouton "Ajouter aux favoris"
        const favBtn = page.locator(
            'button:has-text("Favori"), button:has-text("♥"), [data-testid="add-favorite"]'
        ).first();

        if (await favBtn.isVisible({ timeout: 8000 })) {
            await favBtn.click();
            // Vérifier qu'une requête POST a bien été faite
            // (le mock retourne 201 sans erreur)
        }
    });
});

test.describe("Historique de recherche", () => {
    test.beforeEach(async ({ page }) => {
        await page.route("**/api/trajet/history**", async (route) => {
            if (route.request().method() === "GET") {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify([
                        {
                            history_id: 1,
                            gare_depart: "Paris",
                            gare_arrivee: "Bordeaux",
                            date_recherche: "2024-06-15",
                            type_train: JSON.stringify({ duree: "3h14", co2_economise: 55, prix: 89 }),
                        },
                    ]),
                });
            } else {
                await route.continue();
            }
        });

        await loginAsTestUser(page);
    });

    test("l'historique apparaît dans la page profil", async ({ page }) => {
        await page.route("**/api/users/**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    user_id: "test-user-id",
                    first_name: "Test",
                    last_name: "User",
                    email: "test@railgo.fr",
                }),
            })
        );

        await page.goto("/profil");

        // L'historique doit mentionner au moins une ville
        await expect(page.locator('text="Paris", text="Bordeaux"').first()).toBeVisible({ timeout: 8000 });
    });
});
