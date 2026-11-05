import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NoticeList } from './NoticeList.tsx';
import { mockFetch, noticeFixture, renderRoute } from '../test/utils.tsx';

const page = (items = [noticeFixture()]) => ({
  body: { items, page: 1, pageSize: 12, total: items.length },
});

describe('NoticeList (FR-07 to FR-10)', () => {
  it('renders notices with the fictional badge (FR-21)', async () => {
    mockFetch(() => page());
    renderRoute(<NoticeList />, { path: '/avisos', route: '/avisos' });

    const item = await screen.findByRole('link', { name: /Luna/ });
    expect(within(item).getByText('Exemplo fictício')).toBeInTheDocument();
    expect(within(item).getByText(/Centro/)).toBeInTheDocument();
    expect(screen.getByText('1 aviso encontrado')).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    mockFetch(() => page([]));
    renderRoute(<NoticeList />, { path: '/avisos', route: '/avisos' });
    expect(await screen.findByText('Nenhum aviso encontrado.')).toBeInTheDocument();
  });

  it('shows the error state with a retry button', async () => {
    mockFetch(() => ({ status: 500, body: { error: 'Erro inesperado. Tente novamente.' } }));
    renderRoute(<NoticeList />, { path: '/avisos', route: '/avisos' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar.');
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('updates the URL and the API query when a filter changes', async () => {
    const calls = mockFetch(() => page());
    const user = userEvent.setup();
    renderRoute(<NoticeList />, { path: '/avisos', route: '/avisos' });
    await screen.findByRole('link', { name: /Luna/ });

    await user.click(screen.getByRole('button', { name: 'Filtros' }));
    await user.selectOptions(screen.getByLabelText('Bairro'), 'centro');
    await user.selectOptions(screen.getByLabelText('Espécie'), 'dog');

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/avisos?neighborhood=centro&species=dog',
    );
    await waitFor(() =>
      expect(calls.at(-1)?.url).toBe('/api/notices?neighborhood=centro&species=dog&page=1'),
    );
  });

  it('reads filters from the URL on load', async () => {
    const calls = mockFetch(() => page());
    renderRoute(<NoticeList />, { path: '/avisos', route: '/avisos?color=caramel&page=2' });
    await screen.findByRole('link', { name: /Luna/ });
    expect(calls[0]?.url).toBe('/api/notices?color=caramel&page=2');
    expect(screen.getByLabelText('Cor')).toHaveValue('caramel');
  });
});
