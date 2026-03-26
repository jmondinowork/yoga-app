import { test, expect, Page } from '@playwright/test';

async function loginUser(page: Page) {
  await page.goto('/connexion', { waitUntil: 'networkidle' });
  await page.locator('#email').fill('demo@yogaflow.fr');
  await page.locator('#password').fill('password123');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/mon-espace/, { timeout: 30000 });
}

test.describe('Dashboard utilisateur', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('le tableau de bord s\'affiche', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('la sidebar est visible', async ({ page }) => {
    await expect(page.locator('text=Paramètres').first()).toBeVisible();
  });

  test('la page paramètres se charge', async ({ page }) => {
    await page.goto('/mon-espace/parametres', { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('la page mes achats se charge', async ({ page }) => {
    await page.goto('/mon-espace/mes-achats', { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Achat simulé', () => {
  test('achat d\'un cours', async ({ page }) => {
    await loginUser(page);

    // Aller sur un cours
    await page.goto('/cours', { waitUntil: 'networkidle' });
    const firstCourse = page.locator('a[href*="/cours/"]').first();
    await expect(firstCourse).toBeVisible({ timeout: 15000 });
    await firstCourse.click();
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    // Chercher un bouton d'achat  
    const buyButton = page.locator('button').filter({ hasText: /acheter|accéder/i }).first();
    if (await buyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await buyButton.click();
      // En mode simulation, redirection success
      await page.waitForTimeout(5000);
    }
  });
});
