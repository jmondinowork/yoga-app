import { test, expect, Page } from '@playwright/test';

// Helper réutilisable pour se connecter
export async function login(page: Page, email: string, password: string) {
  await page.goto('/connexion', { waitUntil: 'networkidle' });
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/mon-espace/, { timeout: 30000 });
}

test.describe('Pages publiques', () => {
  test('la page d\'accueil se charge', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Prana Motion Yoga').first()).toBeVisible();
  });

  test('la navbar affiche les liens', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav.locator('text=Cours').first()).toBeVisible();
    await expect(nav.locator('text=Formations').first()).toBeVisible();
    await expect(nav.locator('text=Tarifs').first()).toBeVisible();
  });

  test('la page des cours se charge et affiche des cartes', async ({ page }) => {
    await page.goto('/cours', { waitUntil: 'networkidle' });
    await expect(page.locator('a[href*="/cours/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('la barre de recherche des cours fonctionne', async ({ page }) => {
    await page.goto('/cours', { waitUntil: 'networkidle' });
    const search = page.getByPlaceholder('Rechercher un cours...');
    await expect(search).toBeVisible({ timeout: 10000 });
    await search.fill('Vinyasa');
    await page.waitForTimeout(1500);
    // La page devrait toujours afficher des résultats
    await expect(page.locator('a[href*="/cours/"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('la page des formations affiche les formations', async ({ page }) => {
    await page.goto('/formations', { waitUntil: 'networkidle' });
    await expect(page.locator('a[href*="/formations/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('la page tarifs affiche les plans', async ({ page }) => {
    await page.goto('/tarifs', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Mensuel').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Annuel').first()).toBeVisible();
  });

  test('la page à propos se charge', async ({ page }) => {
    await page.goto('/a-propos', { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('le détail d\'un cours se charge', async ({ page }) => {
    await page.goto('/cours', { waitUntil: 'networkidle' });
    const firstCourse = page.locator('a[href*="/cours/"]').first();
    await expect(firstCourse).toBeVisible({ timeout: 15000 });
    await firstCourse.click();
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/cours\/.+/);
  });
});
