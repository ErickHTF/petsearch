// Mobile quality bar on every screen: no horizontal scroll, 44px targets, WCAG 2.2 AA (NFR-01 to NFR-03).
import { expect, test, type Page } from '@playwright/test';
import {
  DEMO_MODERATOR,
  DEMO_OWNER,
  expectMobileQuality,
  resetAxeEvidence,
  saveEvidenceScreenshot,
  signIn,
} from './helpers.ts';

async function lunaId(page: Page) {
  const res = await page.request.get('/api/notices?neighborhood=centro&species=dog&size=medium');
  const body = (await res.json()) as { items: { id: string; animal: { name?: string } }[] };
  const luna = body.items.find((n) => n.animal.name === 'Luna');
  expect(luna).toBeTruthy();
  return luna!.id;
}

async function visit(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main')).toBeVisible();
}

test('public screens', async ({ page }) => {
  if (page.viewportSize()?.width === 360) resetAxeEvidence();
  const id = await lunaId(page);
  for (const [path, requirement] of [
    ['/', 'FR-07'],
    ['/avisos', 'FR-08'],
    [`/avisos/${id}`, 'FR-11'],
    [`/avisos/${id}/avistamento`, 'FR-12'],
    ['/entrar', 'FR-16'],
    ['/cadastrar', 'PRV-03'],
    ['/sobre', 'FR-22'],
    ['/privacidade', 'PRV-07'],
    ['/pagina-que-nao-existe', 'NFR-01'],
  ]) {
    await test.step(path, async () => {
      await visit(page, path);
      await expectMobileQuality(page);
      if (page.viewportSize()?.width === 360) {
        await saveEvidenceScreenshot(page, requirement, path);
      }
    });
  }
});

test('filter panel open', async ({ page }) => {
  await visit(page, '/avisos');
  await page.getByRole('button', { name: 'Filtros' }).click();
  await expectMobileQuality(page);
  if (page.viewportSize()?.width === 360) {
    await saveEvidenceScreenshot(page, 'FR-08', 'avisos-filtros-abertos');
  }
});

test('owner screens', async ({ page }) => {
  const id = await lunaId(page);
  await signIn(page, DEMO_OWNER);
  for (const path of ['/minha-conta', '/avisos/novo', `/minha-conta/avisos/${id}`]) {
    await test.step(path, async () => {
      await visit(page, path);
      await expectMobileQuality(page);
      if (page.viewportSize()?.width === 360) {
        await saveEvidenceScreenshot(page, path === '/avisos/novo' ? 'FR-01' : 'FR-13', path);
      }
    });
  }
});

test('publish form steps 2 and 3', async ({ page }) => {
  await signIn(page, DEMO_OWNER);
  await visit(page, '/avisos/novo');
  await page.getByRole('radio', { name: 'Perdi meu animal' }).check();
  await page.getByLabel('Espécie').selectOption({ label: 'Gato' });
  await page.getByLabel('Porte').selectOption({ label: 'Pequeno' });
  await page.getByRole('checkbox', { name: 'Preto' }).check();
  await page.getByRole('radio', { name: 'Macho' }).check();
  await page
    .getByRole('group', { name: 'Tem microchip?' })
    .getByRole('radio', { name: 'Não', exact: true })
    .check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expectMobileQuality(page);
  if (page.viewportSize()?.width === 360) {
    await saveEvidenceScreenshot(page, 'FR-01', 'avisos-novo-etapa-2');
  }
  await page.getByLabel('Bairro').selectOption({ label: 'Centro' });
  await page.getByLabel('Data em que se perdeu').fill('2026-11-02');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expectMobileQuality(page);
  if (page.viewportSize()?.width === 360) {
    await saveEvidenceScreenshot(page, 'FR-01', 'avisos-novo-etapa-3');
  }
});

test('moderation screen', async ({ page }) => {
  await signIn(page, DEMO_MODERATOR);
  await visit(page, '/moderacao');
  await expectMobileQuality(page);
  if (page.viewportSize()?.width === 360) {
    await saveEvidenceScreenshot(page, 'FR-17', 'moderacao');
  }
});
