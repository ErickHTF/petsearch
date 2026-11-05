import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SignIn, SignUp } from './AuthPages.tsx';
import { mockFetch, owner, renderRoute } from '../test/utils.tsx';

describe('SignUp (FR-16, PRV-03)', () => {
  it('labels every input and leaves consent unticked', () => {
    mockFetch(() => undefined);
    renderRoute(<SignUp />, { path: '/cadastrar', route: '/cadastrar' });
    expect(screen.getByLabelText('Como quer ser chamado')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/Li e concordo/)).not.toBeChecked();
    expect(screen.getByRole('link', { name: 'política de privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    );
  });

  it('shows client-side errors without calling the API', async () => {
    const calls = mockFetch(() => undefined);
    const user = userEvent.setup();
    renderRoute(<SignUp />, { path: '/cadastrar', route: '/cadastrar' });

    await user.type(screen.getByLabelText('E-mail'), 'nao-e-email');
    await user.type(screen.getByLabelText('Senha'), '123');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Informe como quer ser chamado.')).toBeInTheDocument();
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(screen.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeInTheDocument();
    expect(
      screen.getByText('É preciso autorizar o uso dos dados para continuar.'),
    ).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('shows the server error on the email field', async () => {
    mockFetch(() => ({
      status: 409,
      body: {
        error: 'Este e-mail já está cadastrado.',
        fields: { email: 'Este e-mail já está cadastrado.' },
      },
    }));
    const user = userEvent.setup();
    renderRoute(<SignUp />, { path: '/cadastrar', route: '/cadastrar' });

    await user.type(screen.getByLabelText('Como quer ser chamado'), 'Ana');
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), '12345678');
    await user.click(screen.getByLabelText(/Li e concordo/));
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este e-mail já está cadastrado.');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('SignIn (FR-16)', () => {
  it('signs in and returns to the requested internal page', async () => {
    const calls = mockFetch(() => ({ body: owner }));
    const user = userEvent.setup();
    renderRoute(<SignIn />, { path: '/entrar', route: '/entrar?voltar=%2Favisos%2Fnovo' });

    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), '12345678');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/avisos/novo'));
    expect(calls[0]).toMatchObject({ url: '/api/auth/sign-in', method: 'POST' });
  });

  it('ignores external redirect targets', async () => {
    mockFetch(() => ({ body: owner }));
    const user = userEvent.setup();
    renderRoute(<SignIn />, { path: '/entrar', route: '/entrar?voltar=%2F%2Fevil.example' });
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), '12345678');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/minha-conta'));
  });
});
