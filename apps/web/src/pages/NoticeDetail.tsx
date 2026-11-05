// Notice detail laid out for comparison (FR-11, FR-14, FR-21, PRV-01).
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  MICROCHIP_LABELS,
  NOTICE_STATUS_LABELS,
  NOTICE_TYPE_LABELS,
  SEX_LABELS,
  SIZE_LABELS,
  SPECIES_LABELS,
  neighborhoodName,
  type PublicNotice,
} from '@petsearch/shared';
import { ApiRequestError, imageUrl } from '../lib/api.ts';
import { api, queryKeys } from '../lib/endpoints.ts';
import { useTitle } from '../lib/hooks.ts';
import {
  colorsLabel,
  eventDateLabel,
  formatDate,
  formatDateTime,
  noticeTitle,
} from '../lib/format.ts';
import { FictionalBadge, StatusBadge, TypeBadge } from '../components/Badges.tsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.tsx';

/** Fixed order so two notices can be compared field by field. */
export function characteristicRows(notice: PublicNotice): [string, string][] {
  const rows: [string, string | undefined][] = [
    ['Tipo', NOTICE_TYPE_LABELS[notice.type]],
    ['Situação', NOTICE_STATUS_LABELS[notice.status]],
    ['Nome', notice.animal.name ?? 'Não informado'],
    ['Espécie', SPECIES_LABELS[notice.animal.species]],
    ['Porte', SIZE_LABELS[notice.animal.size]],
    ['Cores', colorsLabel(notice.animal.coatColors)],
    ['Sexo', SEX_LABELS[notice.animal.sex]],
    ['Microchip', MICROCHIP_LABELS[notice.animal.hasMicrochip]],
    ['Sinais particulares', notice.animal.distinctiveMarks ?? 'Não informado'],
    ['Bairro', neighborhoodName(notice.neighborhood)],
    [eventDateLabel(notice.type), formatDate(notice.eventDate)],
  ];
  return rows.map(([label, value]) => [label, value ?? 'Não informado']);
}

export function NoticeView({
  notice,
  titleAs: Title = 'h1',
}: {
  notice: PublicNotice;
  titleAs?: 'h1' | 'h2';
}) {
  return (
    <>
      <div className="mb-2 flex flex-wrap gap-1">
        <TypeBadge type={notice.type} />
        <StatusBadge status={notice.status} />
        {notice.isFictional ? <FictionalBadge /> : null}
      </div>
      <Title className="text-2xl font-bold">{noticeTitle(notice)}</Title>

      {notice.isFictional ? (
        <p className="mt-2 rounded-lg bg-warning-soft p-3 text-warning-ink">
          Este aviso é um exemplo fictício, usado para demonstrar e testar o protótipo.
        </p>
      ) : null}

      {notice.photos.length ? (
        <ul
          aria-label="Fotos"
          className="mt-4 flex w-full list-none snap-x snap-mandatory gap-2 overflow-x-auto p-0"
        >
          {notice.photos.map((photo) => (
            <li key={photo.id} className="w-full shrink-0 snap-center">
              <img
                src={imageUrl(photo.id)}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className="h-auto max-h-96 w-full rounded-xl bg-canvas object-contain"
              />
            </li>
          ))}
        </ul>
      ) : null}
      {notice.photos.length > 1 ? (
        <p className="mt-1 text-sm text-muted">{notice.photos.length} fotos. Deslize para ver.</p>
      ) : null}

      <section aria-labelledby="characteristics" className="card mt-4 p-4">
        <h2 id="characteristics" className="text-lg font-bold">
          Características
        </h2>
        <dl className="mt-2 grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-3 gap-y-2">
          {characteristicRows(notice).map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-semibold">{label}</dt>
              <dd className="m-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        {notice.description ? (
          <>
            <h3 className="mt-4 font-bold">Descrição</h3>
            <p className="mt-1 whitespace-pre-line break-words">{notice.description}</p>
          </>
        ) : null}
      </section>

      <section aria-labelledby="timeline" className="mt-4">
        <h2 id="timeline" className="text-lg font-bold">
          Histórico do caso
        </h2>
        <ol className="mt-2 list-none border-l-2 border-line-soft p-0 pl-4">
          {notice.timeline.map((entry, index) => (
            <li key={`${entry.at}-${index}`} className="mb-3">
              <p className="text-sm text-muted">{formatDateTime(entry.at)}</p>
              {entry.status ? (
                <p className="font-semibold">{NOTICE_STATUS_LABELS[entry.status]}</p>
              ) : null}
              {entry.note ? <p className="break-words">{entry.note}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export function NoticeDetail() {
  const { id = '' } = useParams();
  const notice = useQuery({ queryKey: queryKeys.notice(id), queryFn: () => api.getNotice(id) });
  useTitle(notice.data ? noticeTitle(notice.data) : 'Aviso');

  if (notice.isPending) return <LoadingState />;
  if (notice.isError) {
    if (notice.error instanceof ApiRequestError && notice.error.status === 404) {
      return (
        <EmptyState
          title="Aviso não encontrado."
          action={
            <Link to="/avisos" className="btn btn-secondary">
              Ver avisos
            </Link>
          }
        >
          Ele pode ter sido removido ou encerrado.
        </EmptyState>
      );
    }
    return <ErrorState error={notice.error} onRetry={() => void notice.refetch()} />;
  }

  const data = notice.data;
  return (
    <>
      <NoticeView notice={data} />
      <section aria-labelledby="contact" className="card mt-4 p-4">
        <h2 id="contact" className="text-lg font-bold">
          Viu este animal?
        </h2>
        <p className="mt-1 text-muted">
          O contato de quem publicou é protegido. Sua mensagem chega só para essa pessoa.
        </p>
        {data.status === 'open' ? (
          <Link to={`/avisos/${data.id}/avistamento`} className="btn btn-primary btn-block mt-3">
            Enviar avistamento ou mensagem
          </Link>
        ) : (
          <p className="mt-2 font-semibold">Este caso não está mais em aberto.</p>
        )}
      </section>
    </>
  );
}
