// Moderation queue: hide, restore or delete with a reason (FR-17).
import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import { LIMITS, moderationActionSchema, type ModerationItem } from '@petsearch/shared';
import { api, queryKeys, type ModerationTargetType } from '../lib/endpoints.ts';
import { applyServerErrors } from '../lib/forms.ts';
import { formatDateTime } from '../lib/format.ts';
import { useTitle } from '../lib/hooks.ts';
import { FictionalBadge, HiddenBadge } from '../components/Badges.tsx';
import { SelectField, TextField } from '../components/Fields.tsx';
import { EmptyState, ErrorState, FormAlert, LoadingState } from '../components/StateViews.tsx';

const ACTION_LABELS = { hide: 'Ocultar', restore: 'Restaurar', delete: 'Excluir' } as const;

function ModerationRow({ item }: { item: ModerationItem }) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof moderationActionSchema>,
    unknown,
    z.output<typeof moderationActionSchema>
  >({
    resolver: zodResolver(moderationActionSchema),
    defaultValues: { action: item.hidden ? 'restore' : 'hide', reason: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api.moderate(item.targetType, item.id, values);
      reset({ action: values.action === 'hide' ? 'restore' : 'hide', reason: '' });
      await queryClient.invalidateQueries({ queryKey: ['moderation'] });
      await queryClient.invalidateQueries({ queryKey: ['notices'] });
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  });

  const actions = (
    item.hidden ? ['restore', 'delete'] : ['hide', 'delete']
  ) as (keyof typeof ACTION_LABELS)[];
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        {item.hidden ? <HiddenBadge /> : null}
        {item.isFictional ? <FictionalBadge /> : null}
        <span className="text-sm text-muted">{formatDateTime(item.createdAt)}</span>
      </div>
      <p className="mt-2 break-words">{item.summary}</p>
      <Link to={`/avisos/${item.noticeId}`} className="inline-flex min-h-11 items-center">
        Ver aviso
      </Link>
      <form noValidate onSubmit={onSubmit} className="mt-2">
        <FormAlert message={formError} />
        <SelectField
          label="Ação"
          options={actions.map((value) => ({ value, label: ACTION_LABELS[value] }))}
          error={errors.action?.message}
          {...register('action')}
        />
        <TextField
          label="Motivo"
          maxLength={LIMITS.reasonMax}
          error={errors.reason?.message}
          {...register('reason')}
        />
        <button type="submit" className="btn btn-secondary btn-block" disabled={isSubmitting}>
          Aplicar
        </button>
      </form>
    </li>
  );
}

export function Moderation() {
  useTitle('Moderação');
  const [targetType, setTargetType] = useState<ModerationTargetType>('notice');
  const items = useQuery({
    queryKey: queryKeys.moderation(targetType),
    queryFn: () => api.moderationItems(targetType),
  });
  const tabs: { value: ModerationTargetType; label: string }[] = [
    { value: 'notice', label: 'Avisos' },
    { value: 'sighting', label: 'Avistamentos' },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Moderação</h1>
      <p className="mt-1 text-muted">Itens mais recentes, incluindo os ocultos.</p>
      <div role="group" aria-label="Tipo de item" className="mt-4 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={targetType === tab.value}
            className={`btn flex-1 ${targetType === tab.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTargetType(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {items.isPending ? (
          <LoadingState />
        ) : items.isError ? (
          <ErrorState error={items.error} onRetry={() => void items.refetch()} />
        ) : items.data.length === 0 ? (
          <EmptyState title="Nada para moderar." />
        ) : (
          <ul className="grid list-none gap-3 p-0">
            {items.data.map((item) => (
              <ModerationRow key={`${item.targetType}-${item.id}`} item={item} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
