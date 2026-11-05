import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SightingForm } from './SightingForm.tsx';
import { formDataJson, mockFetch, noticeFixture, renderRoute } from '../test/utils.tsx';

const route = { path: '/avisos/:id/avistamento', route: '/avisos/n1/avistamento' };

function api(postResult = { status: 201, body: { ok: true } }) {
  return mockFetch(({ method }) => (method === 'POST' ? postResult : { body: noticeFixture() }));
}

describe('SightingForm (FR-12, PRV-01, PRV-09)', () => {
  it('has a honeypot field hidden from people and assistive technology', async () => {
    api();
    const { container } = renderRoute(<SightingForm />, route);
    await screen.findByRole('heading', { name: 'Avisar sobre Luna' });

    const honeypot = container.querySelector<HTMLInputElement>('#website');
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute('tabindex', '-1');
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Não preencha este campo' })).toBeNull();
  });

  it('blocks sending without consent', async () => {
    const calls = api();
    const user = userEvent.setup();
    renderRoute(<SightingForm />, route);
    await screen.findByRole('heading', { name: 'Avisar sobre Luna' });

    await user.type(screen.getByLabelText('Quando você viu?'), '2026-11-02');
    await user.selectOptions(screen.getByLabelText('Em qual bairro?'), 'centro');
    await user.type(screen.getByLabelText('O que você viu?'), 'Vi perto da escola.');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText('É preciso autorizar o uso dos dados para continuar.'),
    ).toBeInTheDocument();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
  });

  it('asks for consent before sharing a contact', async () => {
    api();
    const user = userEvent.setup();
    renderRoute(<SightingForm />, route);
    await screen.findByRole('heading', { name: 'Avisar sobre Luna' });

    expect(screen.queryByLabelText(/Autorizo enviar meu contato/)).toBeNull();
    await user.type(screen.getByLabelText(/Telefone ou e-mail/), '19 99999-0000');
    expect(screen.getByLabelText(/Autorizo enviar meu contato/)).not.toBeChecked();
  });

  it('sends the sighting with an empty honeypot', async () => {
    const calls = api();
    const user = userEvent.setup();
    renderRoute(<SightingForm />, route);
    await screen.findByRole('heading', { name: 'Avisar sobre Luna' });

    await user.type(screen.getByLabelText('Quando você viu?'), '2026-11-02');
    await user.selectOptions(screen.getByLabelText('Em qual bairro?'), 'centro');
    await user.type(screen.getByLabelText('O que você viu?'), 'Vi perto da escola.');
    await user.click(screen.getByLabelText(/Autorizo o uso destas informações/));
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByRole('heading', { name: 'Obrigado!' })).toBeInTheDocument();
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.url).toBe('/api/notices/n1/sightings');
    expect(formDataJson(post?.body)).toMatchObject({
      kind: 'sighting',
      seenAt: '2026-11-02',
      neighborhood: 'centro',
      description: 'Vi perto da escola.',
      consent: true,
      website: '',
    });
  });

  it('does not ask for date and neighborhood for a message', async () => {
    api();
    const user = userEvent.setup();
    renderRoute(<SightingForm />, route);
    await screen.findByRole('heading', { name: 'Avisar sobre Luna' });
    await user.click(screen.getByLabelText('Mensagem'));
    expect(screen.queryByLabelText('Quando você viu?')).toBeNull();
    expect(screen.getByLabelText('Sua mensagem')).toBeInTheDocument();
  });
});
