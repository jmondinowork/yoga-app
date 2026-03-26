import { test, expect, Page } from '@playwright/test';

async function loginUser(page: Page) {
  await page.goto('/connexion', { waitUntil: 'networkidle' });
  await page.locator('#email').fill('demo@yogaflow.fr');
  await page.locator('#password').fill('password123');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/mon-espace/, { timeout: 30000 });
}

test.describe('Authentification', () => {
  test('la page de connexion affiche le formulaire', async ({ page }) => {
    await page.goto('/connexion', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Bon retour');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('la page d\'inscription affiche le formulaire', async ({ page }) => {
    await page.goto('/inscription', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Bienvenue');
  });

  test('identifiants invalides → message d\'erreur', async ({ page }) => {
    await page.goto('/connexion', { waitUntil: 'networkidle' });
    await page.locator('#email').fill('wrong@test.com');
    await page.locator('#password').fill('wrongpass');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Email ou mot de passe incorrect')).toBeVisible({ timeout: 15000 });
  });

  test('connexion réussie → redirection /mon-espace', async ({ page }) => {
    await loginUser(page);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('/mon-espace protégé → redirige vers /connexion', async ({ page }) => {
    await page.goto('/mon-espace');
    await expect(page).toHaveURL(/connexion/, { timeout: 15000 });
  });
});
