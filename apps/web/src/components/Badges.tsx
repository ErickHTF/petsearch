import {
  NOTICE_STATUS_LABELS,
  NOTICE_TYPE_LABELS,
  type NoticeStatus,
  type NoticeType,
} from '@petsearch/shared';

/** Marks sample data as fictional (FR-21, PRC-07). */
export function FictionalBadge() {
  return <span className="badge bg-warning-soft text-warning-ink">Exemplo fictício</span>;
}

export function TypeBadge({ type }: { type: NoticeType }) {
  const style = type === 'lost' ? 'bg-danger-soft text-danger' : 'bg-navy-soft text-navy';
  return <span className={`badge ${style}`}>{NOTICE_TYPE_LABELS[type]}</span>;
}

export function StatusBadge({ status }: { status: NoticeStatus }) {
  const style =
    status === 'open'
      ? 'bg-navy-soft text-navy'
      : status === 'reunited'
        ? 'bg-success-soft text-success-ink'
        : 'bg-canvas text-muted';
  return <span className={`badge ${style}`}>{NOTICE_STATUS_LABELS[status]}</span>;
}

export function HiddenBadge() {
  return <span className="badge bg-danger-soft text-danger">Oculto pela moderação</span>;
}
