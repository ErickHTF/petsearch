// Sighting or message through the protected relay (FR-12, PRV-01, PRV-03, PRV-09, PRV-12).
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import type { z } from 'zod';
import { LIMITS, sightingInputSchema, todayIso } from '@petsearch/shared';
import { ApiRequestError } from '../lib/api.ts';
import { api, queryKeys } from '../lib/endpoints.ts';
import { applyServerErrors } from '../lib/forms.ts';
import { noticeTitle } from '../lib/format.ts';
import { useTitle } from '../lib/hooks.ts';
import {
  CheckboxField,
  Choice,
  ChoiceGroup,
  FieldError,
  SelectField,
  TextAreaField,
  TextField,
} from '../components/Fields.tsx';
import { NEIGHBORHOOD_OPTIONS } from '../components/NoticeFields.tsx';
import { EmptyState, ErrorState, FormAlert, LoadingState } from '../components/StateViews.tsx';

type FormValues = z.input<typeof sightingInputSchema>;

export function SightingForm() {
  useTitle('Enviar avistamento');
  const { id = '' } = useParams();
  const notice = useQuery({ queryKey: queryKeys.notice(id), queryFn: () => api.getNotice(id) });
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File>();
  const [photoError, setPhotoError] = useState<string>();
  // Honeypot: invisible to people, bots tend to fill it (PRV-09).
  const [website, setWebsite] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, z.output<typeof sightingInputSchema>>({
    resolver: zodResolver(sightingInputSchema),
    defaultValues: { kind: 'sighting' },
  });
  const kind = watch('kind');
  const contactValue = watch('contactValue');

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const input =
      values.kind === 'message'
        ? { ...values, seenAt: undefined, neighborhood: undefined }
        : values;
    try {
      await api.sendSighting(id, input, website, values.kind === 'sighting' ? photo : undefined);
      setSent(true);
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  });

  if (notice.isPending) return <LoadingState />;
  if (notice.isError) {
    if (notice.error instanceof ApiRequestError && notice.error.status === 404) {
      return <EmptyState title="Aviso não encontrado." />;
    }
    return <ErrorState error={notice.error} onRetry={() => void notice.refetch()} />;
  }

  if (sent) {
    return (
      <div role="status" className="card p-5">
        <h1 className="text-2xl font-bold">Obrigado!</h1>
        <p className="mt-2">
          Sua mensagem foi enviada para quem publicou o aviso. Se você deixou um contato, essa
          pessoa poderá falar com você.
        </p>
        <Link to={`/avisos/${id}`} className="btn btn-secondary btn-block mt-4">
          Voltar ao aviso
        </Link>
      </div>
    );
  }

  if (notice.data.status !== 'open') {
    return (
      <EmptyState title="Este caso não está mais em aberto.">
        Não é possível enviar avistamentos para este aviso.
      </EmptyState>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Avisar sobre {noticeTitle(notice.data)}</h1>
      <p className="mt-1 text-muted">
        Sua mensagem vai só para quem publicou o aviso. Nada do que você escrever aqui fica público.
      </p>

      <form noValidate onSubmit={onSubmit} className="mt-4">
        <FormAlert message={formError} />
        <div className="mt-3">
          <ChoiceGroup legend="O que você quer enviar?" error={errors.kind?.message}>
            <Choice type="radio" value="sighting" label="Vi o animal" {...register('kind')} />
            <Choice type="radio" value="message" label="Mensagem" {...register('kind')} />
          </ChoiceGroup>

          {kind === 'sighting' ? (
            <>
              <TextField
                label="Quando você viu?"
                type="date"
                max={todayIso()}
                error={errors.seenAt?.message}
                {...register('seenAt')}
              />
              <SelectField
                label="Em qual bairro?"
                placeholder="Escolha o bairro"
                options={NEIGHBORHOOD_OPTIONS}
                error={errors.neighborhood?.message}
                {...register('neighborhood')}
              />
            </>
          ) : null}

          <TextAreaField
            label={kind === 'sighting' ? 'O que você viu?' : 'Sua mensagem'}
            hint="Descreva o animal, o horário e pontos de referência próximos."
            rows={4}
            maxLength={LIMITS.sightingMax}
            error={errors.description?.message}
            {...register('description')}
          />

          {kind === 'sighting' ? (
            <div className="mb-4">
              <label htmlFor="sighting-photo" className="mb-1 block font-semibold">
                Foto <span className="font-normal text-muted">(opcional)</span>
              </label>
              <input
                id="sighting-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="input"
                aria-invalid={photoError ? true : undefined}
                aria-describedby={photoError ? 'sighting-photo-error' : undefined}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setPhotoError(undefined);
                  if (file && file.size > 8 * 1024 * 1024) {
                    setPhotoError('A foto pode ter no máximo 8 MB.');
                    event.target.value = '';
                    return;
                  }
                  setPhoto(file);
                }}
              />
              <FieldError id="sighting-photo" error={photoError} />
            </div>
          ) : null}

          <fieldset className="card mb-4 p-4">
            <legend className="px-1 font-semibold">Seu contato (opcional)</legend>
            <p className="mb-3 text-sm text-muted">
              Só quem publicou o aviso verá. Deixe em branco se preferir não ser contatado.
            </p>
            <TextField
              label="Seu nome"
              optional
              autoComplete="given-name"
              maxLength={LIMITS.nameMax}
              error={errors.contactName?.message}
              {...register('contactName')}
            />
            <TextField
              label="Telefone ou e-mail"
              optional
              maxLength={LIMITS.contactMax}
              error={errors.contactValue?.message}
              {...register('contactValue')}
            />
            {contactValue ? (
              <CheckboxField
                label="Autorizo enviar meu contato para quem publicou o aviso."
                error={errors.contactConsent?.message}
                {...register('contactConsent')}
              />
            ) : null}
          </fieldset>

          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">Não preencha este campo</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          <CheckboxField
            label={
              <>
                Autorizo o uso destas informações para ajudar a encontrar o animal, conforme a{' '}
                <Link to="/privacidade" className="underline underline-offset-2">
                  política de privacidade
                </Link>
                .
              </>
            }
            error={errors.consent?.message}
            {...register('consent')}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </>
  );
}
