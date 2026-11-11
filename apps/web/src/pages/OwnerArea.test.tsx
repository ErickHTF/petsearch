import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { OwnerNotice, OwnerSighting } from '@petsearch/shared';
import { RequireAuth } from '../components/RequireAuth.tsx';
import { Account } from './Account.tsx';
import { ManageNotice } from './ManageNotice.tsx';
import { mockFetch, noticeFixture, owner, renderRoute } from '../test/utils.tsx';

const ownerNotice: OwnerNotice = {
  ...noticeFixture(),
  hidden: false,
  inactive: false,
  newSightings: 2,
};
const sighting: OwnerSighting = {
  id: 's1',
  noticeId: 'n1',
  kind: 'sighting',
  seenAt: '2026-11-02',
  neighborhood: 'centro',
  description: 'Vi perto da escola.',
  contact: { name: 'Bia', value: '19 90000-0000' },
  ownerState: 'new',
  createdAt: '2026-11-02T15:00:00.000Z',
};

describe('RequireAuth (PRV-04)', () => {
  it('redirects anonymous visitors to sign in with the return path', async () => {
    mockFetch(({ url }) => (url === '/api/auth/me' ? { body: { user: null } } : undefined));
    renderRoute(
      <RequireAuth>
        <p>Área privada</p>
      </RequireAuth>,
      { path: '/minha-conta', route: '/minha-conta' },
    );
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/entrar?voltar=%2Fminha-conta'),
    );
    expect(screen.queryByText('Área privada')).toBeNull();
  });

  it('blocks owners from moderator pages', async () => {
    mockFetch(() => ({ body: { user: owner } }));
    renderRoute(
      <RequireAuth requiredRole="moderator">
        <p>Fila de moderação</p>
      </RequireAuth>,
      { path: '/moderacao', route: '/moderacao' },
    );
    expect(await screen.findByText('Esta área é exclusiva da moderação.')).toBeInTheDocument();
    expect(screen.queryByText('Fila de moderação')).toBeNull();
  });
});

describe('Account (FR-13, PRV-07)', () => {
  it('shows new sightings and confirms account deletion in the page', async () => {
    const calls = mockFetch(({ url, method }) => {
      if (url === '/api/auth/me') return { body: { user: owner } };
      if (url === '/api/me/notices') return { body: [ownerNotice] };
      if (url === '/api/account' && method === 'DELETE') return { status: 204 };
      return undefined;
    });
    const user = userEvent.setup();
    renderRoute(<Account />, { path: '/minha-conta', route: '/minha-conta' });

    expect(await screen.findByText('2 novos avistamentos')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Excluir conta e todos os avisos?');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Sim, excluir tudo' }));
    await waitFor(() => expect(calls.some((call) => call.method === 'DELETE')).toBe(true));
  });
});

describe('ManageNotice (FR-13, FR-14, PRV-12)', () => {
  it('shows the sighting contact only to the owner and updates the case', async () => {
    const calls = mockFetch(({ url, method }) => {
      if (url === '/api/me/notices/n1') return { body: ownerNotice };
      if (url === '/api/me/notices/n1/sightings') return { body: [sighting] };
      if (url === '/api/notices/n1/status' && method === 'POST') {
        return { body: { ...ownerNotice, status: 'reunited' } };
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderRoute(<ManageNotice />, {
      path: '/minha-conta/avisos/:id',
      route: '/minha-conta/avisos/n1',
    });

    expect(await screen.findByText(/visível só para você/)).toHaveTextContent('19 90000-0000');
    await user.selectOptions(screen.getByLabelText('Situação'), 'reunited');
    await user.type(screen.getByLabelText(/Atualização/), 'Voltou para casa.');
    await user.click(screen.getByRole('button', { name: 'Salvar atualização' }));

    expect(await screen.findByText('Caso atualizado.')).toBeInTheDocument();
    const post = calls.find((call) => call.url === '/api/notices/n1/status');
    expect(JSON.parse(String(post?.body))).toEqual({
      status: 'reunited',
      note: 'Voltou para casa.',
    });
  });
});
