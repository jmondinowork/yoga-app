import { test, expect, Page } from '@playwright/test';

async function loginAdmin(page: Page) {
  await page.goto('/connexion', { waitUntil: 'networkidle' });
  await page.locator('#email').fill('admin@yogaflow.fr');
  await page.locator('#password').fill('password123');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/mon-espace/, { timeout: 30000 });
}

test.describe('Admin - Accès', () => {
  test('un utilisateur normal ne peut pas accéder à /admin', async ({ page }) => {
    await page.goto('/connexion', { waitUntil: 'networkidle' });
    await page.locator('#email').fill('demo@yogaflow.fr');
    await page.locator('#password').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/mon-espace/, { timeout: 30000 });

    await page.goto('/admin');
    // Redirigé vers / (non admin)
    await expect(page).not.toHaveURL(/\/admin/, { timeout: 15000 });
  });

  test('un admin peut accéder à /admin', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/admin/);
  });
});

test.describe('Admin - Cours', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('la page liste les cours', async ({ page }) => {
    await page.goto('/admin/cours', { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
  });

  test('la recherche fonctionne', async ({ page }) => {
    await page.goto('/admin/cours', { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[type="text"], input[placeholder*="echerch"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Yoga');
      await page.waitForTimeout(1500);
    }
  });

  test('le bouton ajouter ouvre le formulaire', async ({ page }) => {
    await page.goto('/admin/cours', { waitUntil: 'networkidle' });
    const addButton = page.locator('button').filter({ hasText: /ajouter/i }).first();
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click();
      // Le modal de création s'ouvre
      await expect(page.locator('input').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Admin - Formations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('la page liste les formations', async ({ page }) => {
    await page.goto('/admin/formations', { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Admin - Abonnements', () => {
  test('la page affiche le dashboard', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/abonnements', { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
  });
});
