import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { PublicNotice, SessionUser } from '@petsearch/shared';

export interface Call {
  url: string;
  method: string;
  body: unknown;
}

type Handler = (call: Call) => { status?: number; body?: unknown } | undefined;

/** Replaces fetch; the handler returns a status and JSON body per call. Unhandled calls get 404. */
export function mockFetch(handler: Handler) {
  const calls: Call[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: Call = { url: String(input), method: init?.method ?? 'GET', body: init?.body };
    calls.push(call);
    const result = handler(call) ?? { status: 404, body: { error: 'Não encontrado.' } };
    const status = result.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(result.body ?? null), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fn);
  return calls;
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

export function renderRoute(
  element: ReactElement,
  { path = '/', route = '/' }: { path?: string; route?: string } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={element} />
          <Route path="*" element={<p>Outra página</p>} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

export const owner: SessionUser = {
  id: 'u1',
  displayName: 'Ana',
  email: 'ana@exemplo.com',
  role: 'owner',
};

export function noticeFixture(overrides: Partial<PublicNotice> = {}): PublicNotice {
  return {
    id: 'n1',
    type: 'lost',
    status: 'open',
    animal: {
      name: 'Luna',
      species: 'dog',
      size: 'medium',
      coatColors: ['caramel'],
      sex: 'female',
      hasMicrochip: 'unknown',
    },
    neighborhood: 'centro',
    eventDate: '2026-11-01',
    description: 'Cadela dócil.',
    photos: [{ id: 'p1', alt: 'Foto 1 de Luna', width: 800, height: 600 }],
    timeline: [{ at: '2026-11-01T12:00:00.000Z', status: 'open', note: 'Aviso publicado.' }],
    isFictional: true,
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-01T12:00:00.000Z',
    ...overrides,
  };
}

/** Parses the JSON `data` field of a multipart body sent by the API client. */
export function formDataJson(body: unknown): Record<string, unknown> {
  if (!(body instanceof FormData)) throw new Error('Expected FormData body');
  return JSON.parse(String(body.get('data'))) as Record<string, unknown>;
}
