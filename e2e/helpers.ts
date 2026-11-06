import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import sharp from 'sharp';

export const DEMO_OWNER = { email: 'tutora.demo@exemplo.test', password: 'senha-demo-123' };
export const DEMO_MODERATOR = { email: 'moderacao.demo@exemplo.test', password: 'senha-demo-123' };

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemplo.test`;
}

/** Generated test image; no real photo is used (PRV-06). */
export async function testPhoto() {
  const buffer = await sharp({
    create: { width: 1200, height: 900, channels: 3, background: { r: 200, g: 150, b: 90 } },
  })
    .jpeg()
    .toBuffer();
  return { name: 'foto-teste.jpg', mimeType: 'image/jpeg', buffer };
}

export async function signUp(page: Page, email: string) {
  await page.goto('/cadastrar');
  await page.getByLabel('Como quer ser chamado').fill('Pessoa de teste');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('checkbox', { name: /Li e concordo/ }).check();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Minha conta', level: 1 })).toBeVisible();
}

export async function signIn(page: Page, account: { email: string; password: string }) {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Minha conta', level: 1 })).toBeVisible();
}

export async function signOut(page: Page) {
  await page.goto('/minha-conta');
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('heading', { name: 'Minha conta', level: 1 })).toBeHidden();
}

/** NFR-03: WCAG 2.2 AA rules, no serious or critical violations. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(blocking, 'axe serious/critical violations').toEqual([]);
  const reportPath = 'docs/evidence/test-logs/2026-11-05_NFR-03_axe-report.json';
  mkdirSync(dirname(reportPath), { recursive: true });
  const evidence = JSON.parse(readFileSync(reportPath, 'utf8')) as {
    commit: string;
    checks: unknown[];
  };
  evidence.checks.push({
    viewport: page.viewportSize(),
    url: page.url(),
    violations: results.violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
  });
  writeFileSync(reportPath, `${JSON.stringify(evidence, null, 2)}\n`);
}

export function resetAxeEvidence() {
  const reportPath = 'docs/evidence/test-logs/2026-11-05_NFR-03_axe-report.json';
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        checks: [],
      },
      null,
      2,
    )}\n`,
  );
}

export function saveEvidenceScreenshot(page: Page, requirement: string, route: string) {
  const slug =
    route === '/'
      ? 'home'
      : route
          .replace(/^\//, '')
          .replaceAll('/', '-')
          .replace(/[^a-z0-9-]/gi, '-');
  const path = `docs/evidence/screenshots/2026-11-05_${requirement}_${slug}-360px.png`;
  mkdirSync(dirname(path), { recursive: true });
  return page.screenshot({ path, fullPage: true });
}

/** NFR-01: nothing wider than the viewport. */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
}

/** NFR-02: visible interactive targets are at least 44x44 CSS px (inline text links excepted). */
export async function expectTouchTargets(page: Page) {
  const small = await page.evaluate(() => {
    const MIN = 43.5;
    const selector =
      'a[href], button, input:not([type=hidden]), select, textarea, [role=button], summary';
    return [...document.querySelectorAll<HTMLElement>(selector)]
      .filter((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1 || style.visibility === 'hidden') return false;
        if (el.closest('[aria-hidden="true"], [hidden]') || el.tabIndex < 0) return false;
        if (style.display === 'inline') return false;
        if (el.matches('input[type=checkbox], input[type=radio]')) {
          // The tap target is the associated label (wrapping or via for=).
          const labels = [...((el as HTMLInputElement).labels ?? [])];
          return !labels.some((label) => label.getBoundingClientRect().height >= MIN);
        }
        return rect.height < MIN || rect.width < MIN;
      })
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const name = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || el.id;
        return `${el.tagName.toLowerCase()} "${name}" ${Math.round(rect.width)}x${Math.round(rect.height)}`;
      });
  });
  expect(small, 'touch targets under 44x44').toEqual([]);
}

export async function expectMobileQuality(page: Page) {
  await expectNoHorizontalScroll(page);
  await expectTouchTargets(page);
  await expectAccessible(page);
}
