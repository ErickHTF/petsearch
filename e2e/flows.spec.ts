// The core flow from the slides (S p7): owner publishes -> resident searches by neighborhood ->
// resident sends a sighting -> owner reviews it and updates the case. All data is fictional.
import { expect, test } from '@playwright/test';
import { DEMO_MODERATOR, signIn, signOut, signUp, testPhoto, uniqueEmail } from './helpers.ts';

test('owner publishes, resident finds it and sends a sighting, owner updates the case (FR-01 to FR-14)', async ({
  page,
}) => {
  const email = uniqueEmail('tutora');
  const name = `Estrela ${Date.now() % 10000}`;
  await signUp(page, email);

  // Step 1 of the slides: publish (FR-01 to FR-06, PRV-03).
  await page.goto('/avisos/novo');
  await page.getByRole('radio', { name: 'Perdi meu animal' }).check();
  await page.getByLabel('Nome do animal (opcional)').fill(name);
  await page.getByLabel('Espécie').selectOption({ label: 'Cachorro' });
  await page.getByLabel('Porte').selectOption({ label: 'Médio' });
  await page.getByRole('checkbox', { name: 'Caramelo' }).check();
  await page.getByRole('radio', { name: 'Fêmea' }).check();
  await page
    .getByRole('group', { name: 'Tem microchip?' })
    .getByRole('radio', { name: 'Não sei' })
    .check();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await page.getByLabel('Bairro').selectOption({ label: 'Vila Furlan' });
  await page.getByLabel('Data em que se perdeu').fill('2026-11-03');
  await page.getByLabel(/Descrição/).fill('Exemplo fictício criado pelo teste automatizado.');
  await page.getByRole('button', { name: 'Continuar' }).click();

  await page.getByLabel('Fotos do animal').setInputFiles(await testPhoto());
  await page.getByRole('checkbox', { name: /Autorizo a publicação/ }).check();
  await page.getByRole('button', { name: 'Publicar aviso' }).click();
  await expect(page).toHaveURL(/\/minha-conta\/avisos\/[0-9a-f-]+/);
  const noticeUrl = page.url().replace(/\/minha-conta\/avisos\/([0-9a-f-]+).*/, '/avisos/$1');
  await signOut(page);

  // Step 2: a resident searches by neighborhood (FR-07, FR-08, FR-11).
  await page.goto('/avisos');
  await page.getByRole('button', { name: 'Filtros' }).click();
  await page.getByLabel('Bairro').selectOption({ label: 'Vila Furlan' });
  await expect(page).toHaveURL(/neighborhood=vila-furlan|bairro=vila-furlan/);
  await expect(page.getByRole('heading', { name, level: 3 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Luna', level: 3 })).toHaveCount(0);
  await page.getByRole('link', { name: new RegExp(name) }).click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  await expect(page.getByText(email)).toHaveCount(0);

  // Step 3: the resident sends a sighting without an account (FR-12, PRV-01).
  await page.getByRole('link', { name: 'Enviar avistamento ou mensagem' }).click();
  await page.getByRole('radio', { name: 'Vi o animal' }).check();
  await page.getByLabel('Quando você viu?').fill('2026-11-04');
  await page.getByLabel('Em qual bairro?').selectOption({ label: 'Centro' });
  await page.getByLabel('O que você viu?').fill('Vi uma cadela caramelo perto da escola (teste).');
  await page.getByRole('checkbox', { name: /Autorizo o uso destas informações/ }).check();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByRole('heading', { name: 'Obrigado!' })).toBeVisible();

  // Sightings never appear on the public page (PRV-12).
  await page.goto(noticeUrl);
  await expect(page.getByText('perto da escola (teste)')).toHaveCount(0);

  // Step 4: the owner reviews the sighting and updates the case (FR-13, FR-14).
  await signIn(page, { email, password: 'senha-de-teste' });
  await page
    .getByRole('link', { name: new RegExp(name) })
    .first()
    .click();
  await expect(page.getByText('Vi uma cadela caramelo perto da escola (teste).')).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como útil' }).click();
  await page.getByLabel('Situação').selectOption({ label: 'Reencontrado' });
  await page
    .getByLabel('Atualização (opcional)')
    .fill('Reencontrada graças a um avistamento (teste).');
  await page.getByRole('button', { name: 'Salvar atualização' }).click();
  await expect(page.getByText('Caso atualizado.')).toBeVisible();

  await page.goto(noticeUrl);
  await expect(page.getByText('Reencontrada graças a um avistamento (teste).')).toBeVisible();
  await page.goto('/avisos?neighborhood=vila-furlan');
  await expect(page.getByRole('heading', { name, level: 3 })).toHaveCount(0);
});

test('free text with a phone number is blocked before publishing (PRV-02)', async ({ page }) => {
  await signUp(page, uniqueEmail('guard'));
  await page.goto('/avisos/novo');
  await page.getByLabel('Sinais particulares (opcional)').fill('Ligue (19) 99876-5432');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText(/Não informe telefone/).first()).toBeVisible();
});

test('every seeded notice is labeled as fictional (FR-21)', async ({ page }) => {
  await page.goto('/avisos');
  const cards = page
    .getByRole('main')
    .getByRole('listitem')
    .filter({ has: page.getByRole('link') });
  await expect(cards.first()).toBeVisible();
  for (const card of await cards.all()) {
    await expect(card.getByText('Exemplo fictício')).toBeVisible();
  }
});

test('a moderator hides a notice and it leaves the public list (FR-17)', async ({ page }) => {
  await signIn(page, DEMO_MODERATOR);
  await page.goto('/moderacao');
  const item = page.getByRole('listitem').filter({ hasText: 'Bento' });
  await expect(item).toBeVisible();
  if (await item.getByText(/Oculto pela moderação/).count()) {
    await item.getByLabel('Ação').selectOption({ label: 'Restaurar' });
    await item.getByLabel('Motivo').fill('Preparação do teste automatizado');
    await item.getByRole('button', { name: 'Aplicar' }).click();
    await expect(item.getByText(/Oculto pela moderação/)).toHaveCount(0);
  }
  await item.getByLabel('Ação').selectOption({ label: 'Ocultar' });
  await item.getByLabel('Motivo').fill('Teste de moderação');
  await item.getByRole('button', { name: 'Aplicar' }).click();
  await expect(item.getByText(/Oculto/)).toBeVisible();
  await signOut(page);
  await page.goto('/avisos');
  await expect(page.getByRole('heading', { name: 'Luna', level: 3 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bento', level: 3 })).toHaveCount(0);
  await signIn(page, DEMO_MODERATOR);
  await page.goto('/moderacao');
  const hiddenItem = page.getByRole('listitem').filter({ hasText: 'Bento' });
  await hiddenItem.getByLabel('Ação').selectOption({ label: 'Restaurar' });
  await hiddenItem.getByLabel('Motivo').fill('Restaurar estado inicial do teste');
  await hiddenItem.getByRole('button', { name: 'Aplicar' }).click();
  await expect(hiddenItem.getByText(/Oculto pela moderação/)).toHaveCount(0);
});

test('a person deletes their account and can no longer sign in (PRV-07)', async ({ page }) => {
  const email = uniqueEmail('apagar');
  await signUp(page, email);
  await page.getByRole('button', { name: 'Excluir minha conta' }).click();
  await page.getByRole('button', { name: 'Sim, excluir tudo' }).click();
  await expect(page.getByRole('heading', { name: 'Minha conta', level: 1 })).toBeHidden();
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible();
});
