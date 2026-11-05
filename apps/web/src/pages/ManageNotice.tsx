// Manage one notice: sightings inbox, status update, edit, delete (FR-13, FR-14, PRV-04, PRV-12).
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import {
  LIMITS,
  NOTICE_STATUSES,
  NOTICE_STATUS_LABELS,
  SIGHTING_KIND_LABELS,
  SIGHTING_OWNER_STATE_LABELS,
  neighborhoodName,
  noticeUpdateSchema,
  statusUpdateSchema,
  type OwnerNotice,
  type OwnerSighting,
  type SightingOwnerState,
} from '@petsearch/shared';
import { ApiRequestError, errorMessage, imageUrl } from '../lib/api.ts';
import { api, queryKeys } from '../lib/endpoints.ts';
import { applyServerErrors } from '../lib/forms.ts';
import { formatDate, formatDateTime, noticeTitle } from '../lib/format.ts';
import { useTitle } from '../lib/hooks.ts';
import { SelectField, TextAreaField } from '../components/Fields.tsx';
import { AnimalFields, PlaceFields, TypeField } from '../components/NoticeFields.tsx';
import { NoticeView } from './NoticeDetail.tsx';
import { EmptyState, ErrorState, FormAlert, LoadingState } from '../components/StateViews.tsx';

function SightingItem({ sighting, noticeId }: { sighting: OwnerSighting; noticeId: string }) {
  const queryClient = useQueryClient();
  const setState = useMutation({
    mutationFn: (ownerState: SightingOwnerState) => api.setSightingState(sighting.id, ownerState),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mySightings(noticeId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.myNotices });
    },
  });
  const actions: { state: SightingOwnerState; label: string }[] = [
    { state: 'useful', label: 'Marcar como útil' },
    { state: 'dismissed', label: 'Descartar' },
    { state: 'new', label: 'Marcar como novo' },
  ];
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge bg-navy-soft text-navy">{SIGHTING_KIND_LABELS[sighting.kind]}</span>
        <span className="badge bg-canvas text-muted">
          {SIGHTING_OWNER_STATE_LABELS[sighting.ownerState]}
        </span>
        <span className="text-sm text-muted">Recebido em {formatDateTime(sighting.createdAt)}</span>
      </div>
      {sighting.kind === 'sighting' ? (
        <p className="mt-2 text-sm">
          Visto em {sighting.seenAt ? formatDate(sighting.seenAt) : '-'} ·{' '}
          {sighting.neighborhood ? neighborhoodName(sighting.neighborhood) : '-'}
        </p>
      ) : null}
      <p className="mt-2 whitespace-pre-line break-words">{sighting.description}</p>
      {sighting.photoId ? (
        <img
          src={imageUrl(sighting.photoId)}
          alt="Foto enviada com o avistamento"
          className="mt-2 max-h-64 rounded-lg object-contain"
        />
      ) : null}
      {sighting.contact ? (
        <p className="mt-2 rounded-lg bg-success-soft p-2 text-success-ink">
          Contato informado (visível só para você):{' '}
          {sighting.contact.name ? `${sighting.contact.name}, ` : ''}
          <span className="break-all">{sighting.contact.value}</span>
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">A pessoa não deixou contato.</p>
      )}
      <FormAlert message={setState.isError ? errorMessage(setState.error) : null} />
      <div className="mt-2 flex flex-wrap gap-2">
        {actions
          .filter((action) => action.state !== sighting.ownerState)
          .map((action) => (
            <button
              key={action.state}
              type="button"
              className="btn btn-secondary"
              disabled={setState.isPending}
              onClick={() => setState.mutate(action.state)}
            >
              {action.label}
            </button>
          ))}
      </div>
    </li>
  );
}

function StatusForm({ notice }: { notice: OwnerNotice }) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof statusUpdateSchema>, unknown, z.output<typeof statusUpdateSchema>>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: notice.status, note: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSaved(false);
    try {
      const updated = await api.updateStatus(notice.id, values);
      queryClient.setQueryData(queryKeys.myNotice(notice.id), updated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.myNotices });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notice(notice.id) });
      reset({ status: updated.status, note: '' });
      setSaved(true);
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="card p-4">
      <h2 className="text-lg font-bold">Atualizar o caso</h2>
      <FormAlert message={formError} />
      {saved ? (
        <p role="status" className="mt-2 rounded-lg bg-success-soft p-2 text-success-ink">
          Caso atualizado.
        </p>
      ) : null}
      <div className="mt-3">
        <SelectField
          label="Situação"
          options={NOTICE_STATUSES.map((value) => ({ value, label: NOTICE_STATUS_LABELS[value] }))}
          error={errors.status?.message}
          {...register('status')}
        />
        <TextAreaField
          label="Atualização"
          optional
          hint="Aparece no histórico público. Não escreva endereço ou telefone."
          rows={3}
          maxLength={LIMITS.noteMax}
          error={errors.note?.message}
          {...register('note')}
        />
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
        Salvar atualização
      </button>
    </form>
  );
}

function EditForm({ notice, onDone }: { notice: OwnerNotice; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<
    z.input<typeof noticeUpdateSchema>,
    unknown,
    z.output<typeof noticeUpdateSchema>
  >({
    resolver: zodResolver(noticeUpdateSchema),
    defaultValues: {
      type: notice.type,
      animal: {
        ...notice.animal,
        name: notice.animal.name ?? '',
        distinctiveMarks: notice.animal.distinctiveMarks ?? '',
      },
      neighborhood: notice.neighborhood,
      eventDate: notice.eventDate,
      description: notice.description ?? '',
    },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const updated = await api.updateNotice(notice.id, values);
      queryClient.setQueryData(queryKeys.myNotice(notice.id), updated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.myNotices });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notice(notice.id) });
      onDone();
    } catch (error) {
      setFormError(applyServerErrors(error, form.setError));
    }
  });
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={onSubmit} className="card p-4">
        <h2 className="text-lg font-bold">Editar aviso</h2>
        <FormAlert message={formError} />
        <div className="mt-3">
          <TypeField />
          <AnimalFields />
          <PlaceFields type={form.watch('type')} />
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary flex-1" onClick={onDone}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={form.formState.isSubmitting}
          >
            Salvar
          </button>
        </div>
      </form>
    </FormProvider>
  );
}

export function ManageNotice() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const notice = useQuery({ queryKey: queryKeys.myNotice(id), queryFn: () => api.myNotice(id) });
  const sightings = useQuery({
    queryKey: queryKeys.mySightings(id),
    queryFn: () => api.mySightings(id),
  });
  const remove = useMutation({
    mutationFn: () => api.deleteNotice(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.myNotices });
      await queryClient.invalidateQueries({ queryKey: ['notices'] });
      navigate('/minha-conta');
    },
  });
  useTitle(notice.data ? `Gerenciar: ${noticeTitle(notice.data)}` : 'Gerenciar aviso');

  if (notice.isPending) return <LoadingState />;
  if (notice.isError) {
    if (notice.error instanceof ApiRequestError && notice.error.status === 404) {
      return (
        <EmptyState
          title="Aviso não encontrado."
          action={
            <Link to="/minha-conta" className="btn btn-secondary">
              Voltar para minha conta
            </Link>
          }
        />
      );
    }
    return <ErrorState error={notice.error} onRetry={() => void notice.refetch()} />;
  }

  const data = notice.data;
  return (
    <>
      <Link to="/minha-conta" className="inline-flex min-h-11 items-center">
        Voltar para minha conta
      </Link>
      <h1 className="mb-3 text-2xl font-bold">Gerenciar: {noticeTitle(data)}</h1>
      {params.get('publicado') ? (
        <p role="status" className="mb-3 rounded-lg bg-success-soft p-3 text-success-ink">
          Aviso publicado. Avistamentos e mensagens aparecem nesta página.
        </p>
      ) : null}
      {data.hidden ? (
        <p role="alert" className="mb-3 rounded-lg bg-danger-soft p-3 text-danger">
          Este aviso foi ocultado pela moderação e não aparece para o público.
        </p>
      ) : null}

      <section aria-labelledby="inbox" className="mb-6">
        <h2 id="inbox" className="text-xl font-bold">
          Avistamentos e mensagens
        </h2>
        <p className="text-sm text-muted">Só você vê esta lista.</p>
        {sightings.isPending ? (
          <LoadingState />
        ) : sightings.isError ? (
          <ErrorState error={sightings.error} onRetry={() => void sightings.refetch()} />
        ) : sightings.data.length === 0 ? (
          <EmptyState title="Nenhum avistamento ainda.">
            Quando alguém enviar um avistamento ou mensagem, ele aparece aqui.
          </EmptyState>
        ) : (
          <ul className="mt-3 grid list-none gap-3 p-0">
            {sightings.data.map((sighting) => (
              <SightingItem key={sighting.id} sighting={sighting} noticeId={id} />
            ))}
          </ul>
        )}
      </section>

      <div className="mb-6">
        <StatusForm notice={data} />
      </div>

      {editing ? (
        <div className="mb-6">
          <EditForm notice={data} onDone={() => setEditing(false)} />
        </div>
      ) : null}

      <section aria-labelledby="public-view" className="mt-6">
        <p id="public-view" className="mb-2 text-sm font-semibold text-muted">
          Como o aviso aparece para o público:
        </p>
        <NoticeView notice={data} titleAs="h2" />
      </section>

      <div className="mt-6 grid gap-2">
        {!editing ? (
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => setEditing(true)}
          >
            Editar aviso
          </button>
        ) : null}
        <Link to={`/avisos/${data.id}`} className="btn btn-secondary btn-block">
          Ver página pública
        </Link>
        {!confirmDelete ? (
          <button
            type="button"
            className="btn btn-ghost btn-block text-danger"
            onClick={() => setConfirmDelete(true)}
          >
            Excluir aviso
          </button>
        ) : (
          <div
            role="alertdialog"
            aria-labelledby="delete-notice-title"
            className="card border-danger p-4"
          >
            <h3 id="delete-notice-title" className="font-bold text-danger">
              Excluir este aviso?
            </h3>
            <p className="mt-1">O aviso, as fotos e os avistamentos recebidos serão apagados.</p>
            <FormAlert message={remove.isError ? errorMessage(remove.error) : null} />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger flex-1"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                Sim, excluir
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
