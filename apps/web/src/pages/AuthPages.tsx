// Sign in and sign up (FR-16, PRV-03).
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { LIMITS, signInSchema, signUpSchema } from '@petsearch/shared';
import { api, queryKeys } from '../lib/endpoints.ts';
import { applyServerErrors } from '../lib/forms.ts';
import { useTitle } from '../lib/hooks.ts';
import { CheckboxField, TextField } from '../components/Fields.tsx';
import { FormAlert } from '../components/StateViews.tsx';

/** Only allow internal paths as the post-login destination. */
function safeBack(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/minha-conta';
}

export function SignIn() {
  useTitle('Entrar');
  const [params] = useSearchParams();
  const back = safeBack(params.get('voltar'));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(signInSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await api.signIn(values);
      queryClient.setQueryData(queryKeys.session, { user });
      navigate(back, { replace: true });
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  });

  return (
    <>
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mt-1 text-muted">Entre para publicar e acompanhar seus avisos.</p>
      <form noValidate onSubmit={onSubmit} className="mt-4">
        <FormAlert message={formError} />
        <div className="mt-3">
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Senha"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="mt-6">
        Ainda não tem conta?{' '}
        <Link
          to={`/cadastrar?voltar=${encodeURIComponent(back)}`}
          className="inline-flex min-h-11 items-center font-semibold"
        >
          Criar conta
        </Link>
      </p>
    </>
  );
}

export function SignUp() {
  useTitle('Criar conta');
  const [params] = useSearchParams();
  const back = safeBack(params.get('voltar'));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(signUpSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await api.signUp(values);
      queryClient.setQueryData(queryKeys.session, { user });
      navigate(back, { replace: true });
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  });

  return (
    <>
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <p className="mt-1 text-muted">
        Seu nome e e-mail não aparecem nos avisos. Eles servem só para você entrar na sua conta.
      </p>
      <form noValidate onSubmit={onSubmit} className="mt-4">
        <FormAlert message={formError} />
        <div className="mt-3">
          <TextField
            label="Como quer ser chamado"
            autoComplete="given-name"
            maxLength={LIMITS.nameMax}
            error={errors.displayName?.message}
            {...register('displayName')}
          />
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Senha"
            type="password"
            autoComplete="new-password"
            hint={`Pelo menos ${LIMITS.passwordMin} caracteres.`}
            error={errors.password?.message}
            {...register('password')}
          />
          <CheckboxField
            label={
              <>
                Li e concordo com a{' '}
                <Link
                  to="/privacidade"
                  target="_blank"
                  rel="noopener"
                  className="underline underline-offset-2"
                >
                  política de privacidade
                </Link>{' '}
                e autorizo o uso dos meus dados para usar o PETSEARCH.
              </>
            }
            error={errors.consent?.message}
            {...register('consent')}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-6">
        Já tem conta?{' '}
        <Link
          to={`/entrar?voltar=${encodeURIComponent(back)}`}
          className="inline-flex min-h-11 items-center font-semibold"
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
