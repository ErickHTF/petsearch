import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NewNotice } from './NewNotice.tsx';
import { formDataJson, mockFetch, renderRoute } from '../test/utils.tsx';

async function fillSteps(user: UserEvent) {
  await user.type(screen.getByLabelText(/Nome do animal/), 'Luna');
  await user.selectOptions(screen.getByLabelText('Espécie'), 'dog');
  await user.selectOptions(screen.getByLabelText('Porte'), 'medium');
  await user.click(screen.getByLabelText('Caramelo'));
  await user.click(screen.getByLabelText('Fêmea'));
  await user.click(screen.getByLabelText('Não sei', { selector: '[name="animal.hasMicrochip"]' }));
  await user.click(screen.getByRole('button', { name: 'Continuar' }));

  await screen.findByText(/Etapa 2 de 3/);
  await user.selectOptions(screen.getByLabelText('Bairro'), 'centro');
  await user.type(screen.getByLabelText('Data em que se perdeu'), '2026-11-01');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByText(/Etapa 3 de 3/);
}

describe('NewNotice (FR-01 to FR-06, PRV-03)', () => {
  it('shows validation errors and stays on step 1 when required fields are empty', async () => {
    mockFetch(() => undefined);
    const user = userEvent.setup();
    renderRoute(<NewNotice />, { path: '/avisos/novo', route: '/avisos/novo' });

    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Escolha a espécie.')).toBeInTheDocument();
    expect(screen.getByText('Escolha o porte.')).toBeInTheDocument();
    expect(screen.getByText('Escolha pelo menos uma cor.')).toBeInTheDocument();
    expect(screen.getByText(/Etapa 1 de 3/)).toBeInTheDocument();
    expect(screen.getByLabelText('Espécie')).toHaveAttribute('aria-invalid', 'true');
  });

  it('preselects the notice type from the URL', () => {
    mockFetch(() => undefined);
    renderRoute(<NewNotice />, { path: '/avisos/novo', route: '/avisos/novo?tipo=found' });
    expect(screen.getByLabelText('Encontrei um animal')).toBeChecked();
  });

  it('blocks publishing without consent and without photos', async () => {
    const calls = mockFetch(() => undefined);
    const user = userEvent.setup();
    renderRoute(<NewNotice />, { path: '/avisos/novo', route: '/avisos/novo?tipo=lost' });
    await fillSteps(user);

    const consent = screen.getByLabelText(/Autorizo a publicação/);
    expect(consent).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Publicar aviso' }));

    expect(
      await screen.findByText('É preciso autorizar o uso dos dados para continuar.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Adicione pelo menos uma foto.')).toBeInTheDocument();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
  });

  it('publishes with photos and consent', async () => {
    const calls = mockFetch(({ method }) =>
      method === 'POST' ? { status: 201, body: { id: 'n9' } } : undefined,
    );
    const user = userEvent.setup();
    renderRoute(<NewNotice />, { path: '/avisos/novo', route: '/avisos/novo?tipo=lost' });
    await fillSteps(user);

    const photo = new File(['x'], 'luna.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('Fotos do animal'), photo);
    expect(screen.getByRole('img', { name: 'Prévia da foto 1' })).toBeInTheDocument();
    await user.click(screen.getByLabelText(/Autorizo a publicação/));
    await user.click(screen.getByRole('button', { name: 'Publicar aviso' }));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/minha-conta/avisos/n9?publicado=1',
      ),
    );
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.url).toBe('/api/notices');
    const data = formDataJson(post?.body);
    expect(data).toMatchObject({
      type: 'lost',
      neighborhood: 'centro',
      eventDate: '2026-11-01',
      consent: true,
      animal: { name: 'Luna', species: 'dog', size: 'medium', coatColors: ['caramel'] },
    });
    expect((post?.body as FormData).getAll('photos')).toHaveLength(1);
  });

  it('shows server field errors on the matching step', async () => {
    mockFetch(({ method }) =>
      method === 'POST'
        ? {
            status: 400,
            body: {
              error: 'Verifique os campos destacados.',
              fields: { description: 'Não informe telefone.' },
            },
          }
        : undefined,
    );
    const user = userEvent.setup();
    renderRoute(<NewNotice />, { path: '/avisos/novo', route: '/avisos/novo?tipo=lost' });
    await fillSteps(user);
    await user.upload(
      screen.getByLabelText('Fotos do animal'),
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
    );
    await user.click(screen.getByLabelText(/Autorizo a publicação/));
    await user.click(screen.getByRole('button', { name: 'Publicar aviso' }));

    expect(await screen.findByText('Não informe telefone.')).toBeInTheDocument();
    expect(screen.getByText(/Etapa 2 de 3/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Verifique os campos destacados.');
  });
});
