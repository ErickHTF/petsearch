import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NoticeDetail, characteristicRows } from './NoticeDetail.tsx';
import { mockFetch, noticeFixture, renderRoute } from '../test/utils.tsx';

describe('NoticeDetail (FR-11, FR-21)', () => {
  it('shows the fictional badge, characteristics and the protected contact action', async () => {
    mockFetch(({ url }) => (url === '/api/notices/n1' ? { body: noticeFixture() } : undefined));
    renderRoute(<NoticeDetail />, { path: '/avisos/:id', route: '/avisos/n1' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Luna' })).toBeInTheDocument();
    expect(screen.getByText('Exemplo fictício')).toBeInTheDocument();
    expect(screen.getByText(/exemplo fictício, usado para demonstrar/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Foto 1 de Luna' })).toHaveAttribute(
      'src',
      '/api/images/p1',
    );
    expect(screen.getByRole('link', { name: 'Enviar avistamento ou mensagem' })).toHaveAttribute(
      'href',
      '/avisos/n1/avistamento',
    );
    expect(screen.getByText('Aviso publicado.')).toBeInTheDocument();
  });

  it('hides the sighting action when the case is closed', async () => {
    mockFetch(() => ({ body: noticeFixture({ status: 'reunited', isFictional: false }) }));
    renderRoute(<NoticeDetail />, { path: '/avisos/:id', route: '/avisos/n1' });
    expect(await screen.findByText('Este caso não está mais em aberto.')).toBeInTheDocument();
    expect(screen.queryByText('Exemplo fictício')).not.toBeInTheDocument();
  });

  it('shows not found for hidden or unknown notices', async () => {
    mockFetch(() => ({ status: 404, body: { error: 'Não encontrado.' } }));
    renderRoute(<NoticeDetail />, { path: '/avisos/:id', route: '/avisos/x' });
    expect(await screen.findByText('Aviso não encontrado.')).toBeInTheDocument();
  });

  it('lists characteristics in a fixed order for comparison', () => {
    expect(characteristicRows(noticeFixture()).map(([label]) => label)).toEqual([
      'Tipo',
      'Situação',
      'Nome',
      'Espécie',
      'Porte',
      'Cores',
      'Sexo',
      'Microchip',
      'Sinais particulares',
      'Bairro',
      'Perdido em',
    ]);
  });
});
