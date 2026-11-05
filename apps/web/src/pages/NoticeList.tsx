// Public list with filters synced to the URL (FR-07 to FR-10).
import { useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  COAT_COLORS,
  COAT_COLOR_LABELS,
  NOTICE_TYPES,
  NOTICE_TYPE_LABELS,
  SIZES,
  SIZE_LABELS,
  SPECIES,
  SPECIES_LABELS,
  todayIso,
} from '@petsearch/shared';
import { api, queryKeys, type ListFilters } from '../lib/endpoints.ts';
import { useTitle } from '../lib/hooks.ts';
import { NoticeCard } from '../components/NoticeCard.tsx';
import { SelectField, TextField } from '../components/Fields.tsx';
import { NEIGHBORHOOD_OPTIONS } from '../components/NoticeFields.tsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.tsx';

const FILTER_KEYS = ['type', 'neighborhood', 'species', 'size', 'color', 'from', 'to'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

function readFilters(params: URLSearchParams): ListFilters {
  const filters: Record<string, string | number> = {};
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }
  const page = Number(params.get('page') ?? '1');
  filters.page = Number.isInteger(page) && page > 0 ? page : 1;
  return filters as ListFilters;
}

const options = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }));

export function NoticeList() {
  useTitle('Avisos');
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const activeCount = FILTER_KEYS.filter((key) => params.get(key)).length;
  const [open, setOpen] = useState(activeCount > 0);
  const panelId = useId();

  const notices = useQuery({
    queryKey: queryKeys.notices(filters),
    queryFn: () => api.listNotices(filters),
    placeholderData: keepPreviousData,
  });

  function setFilter(key: FilterKey, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: true });
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(params);
    if (page > 1) next.set('page', String(page));
    else next.delete('page');
    setParams(next);
    window.scrollTo?.({ top: 0 });
  }

  const value = (key: FilterKey) => params.get(key) ?? '';
  const totalPages = notices.data
    ? Math.max(1, Math.ceil(notices.data.total / notices.data.pageSize))
    : 1;

  return (
    <>
      <h1 className="text-2xl font-bold">Avisos</h1>
      <p className="mt-1 text-muted">Avisos em aberto, do mais recente para o mais antigo.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          Filtros{activeCount ? ` (${activeCount})` : ''}
        </button>
        {activeCount ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      <section id={panelId} hidden={!open} aria-label="Filtros" className="card mt-3 p-4">
        <SelectField
          label="Bairro"
          placeholder="Todos"
          options={NEIGHBORHOOD_OPTIONS}
          value={value('neighborhood')}
          onChange={(e) => setFilter('neighborhood', e.target.value)}
        />
        <SelectField
          label="Tipo"
          placeholder="Todos"
          options={options(NOTICE_TYPES, NOTICE_TYPE_LABELS)}
          value={value('type')}
          onChange={(e) => setFilter('type', e.target.value)}
        />
        <SelectField
          label="Espécie"
          placeholder="Todas"
          options={options(SPECIES, SPECIES_LABELS)}
          value={value('species')}
          onChange={(e) => setFilter('species', e.target.value)}
        />
        <SelectField
          label="Porte"
          placeholder="Todos"
          options={options(SIZES, SIZE_LABELS)}
          value={value('size')}
          onChange={(e) => setFilter('size', e.target.value)}
        />
        <SelectField
          label="Cor"
          placeholder="Todas"
          options={options(COAT_COLORS, COAT_COLOR_LABELS)}
          value={value('color')}
          onChange={(e) => setFilter('color', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="De"
            type="date"
            max={todayIso()}
            value={value('from')}
            onChange={(e) => setFilter('from', e.target.value)}
          />
          <TextField
            label="Até"
            type="date"
            max={todayIso()}
            value={value('to')}
            onChange={(e) => setFilter('to', e.target.value)}
          />
        </div>
      </section>

      <div aria-live="polite" className="mt-4">
        {notices.isPending ? (
          <LoadingState label="Carregando avisos…" />
        ) : notices.isError ? (
          <ErrorState error={notices.error} onRetry={() => void notices.refetch()} />
        ) : notices.data.items.length === 0 ? (
          <EmptyState
            title="Nenhum aviso encontrado."
            action={
              <Link to="/avisos/novo?tipo=found" className="btn btn-secondary">
                Publicar aviso de animal encontrado
              </Link>
            }
          >
            {activeCount ? 'Tente remover alguns filtros.' : 'Ainda não há avisos em aberto.'}
          </EmptyState>
        ) : (
          <>
            <p className="text-sm text-muted">
              {notices.data.total}{' '}
              {notices.data.total === 1 ? 'aviso encontrado' : 'avisos encontrados'}
            </p>
            <ul className="mt-2 grid list-none gap-3 p-0">
              {notices.data.items.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </ul>
            {totalPages > 1 ? (
              <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={notices.data.page <= 1}
                  onClick={() => goToPage(notices.data.page - 1)}
                >
                  Anterior
                </button>
                <span className="text-sm text-muted">
                  Página {notices.data.page} de {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={notices.data.page >= totalPages}
                  onClick={() => goToPage(notices.data.page + 1)}
                >
                  Próxima
                </button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
