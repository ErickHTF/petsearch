import {
  COAT_COLOR_LABELS,
  SIZE_LABELS,
  SPECIES_LABELS,
  type CoatColor,
  type PublicNotice,
} from '@petsearch/shared';

/** Formats a YYYY-MM-DD date as dd/mm/aaaa without time zone shifts. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function colorsLabel(colors: CoatColor[]): string {
  return colors.map((color) => COAT_COLOR_LABELS[color]).join(', ');
}

export function noticeTitle(notice: Pick<PublicNotice, 'animal'>): string {
  return notice.animal.name || `${SPECIES_LABELS[notice.animal.species]} sem nome`;
}

export function noticeSubtitle(notice: Pick<PublicNotice, 'animal'>): string {
  return [
    SPECIES_LABELS[notice.animal.species],
    `porte ${SIZE_LABELS[notice.animal.size].toLowerCase()}`,
    colorsLabel(notice.animal.coatColors).toLowerCase(),
  ].join(' · ');
}

export function eventDateLabel(type: PublicNotice['type']): string {
  return type === 'lost' ? 'Perdido em' : 'Encontrado em';
}
