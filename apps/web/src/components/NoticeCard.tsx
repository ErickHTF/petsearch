import { Link } from 'react-router';
import { neighborhoodName, type PublicNotice } from '@petsearch/shared';
import { imageUrl } from '../lib/api.ts';
import { eventDateLabel, formatDate, noticeSubtitle, noticeTitle } from '../lib/format.ts';
import { FictionalBadge, StatusBadge, TypeBadge } from './Badges.tsx';

export function NoticeCard({ notice }: { notice: PublicNotice }) {
  const photo = notice.photos[0];
  return (
    <li className="card overflow-hidden">
      <Link to={`/avisos/${notice.id}`} className="flex gap-3 p-3 text-ink no-underline">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-canvas">
          {photo ? (
            <img
              src={imageUrl(photo.id)}
              alt={photo.alt}
              width={96}
              height={96}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap gap-1">
            <TypeBadge type={notice.type} />
            {notice.status !== 'open' ? <StatusBadge status={notice.status} /> : null}
            {notice.isFictional ? <FictionalBadge /> : null}
          </div>
          <h3 className="truncate text-base font-semibold">{noticeTitle(notice)}</h3>
          <p className="text-sm text-muted">{noticeSubtitle(notice)}</p>
          <p className="text-sm text-muted">
            {neighborhoodName(notice.neighborhood)} · {eventDateLabel(notice.type).toLowerCase()}{' '}
            {formatDate(notice.eventDate)}
          </p>
        </div>
      </Link>
    </li>
  );
}
