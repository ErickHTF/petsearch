// Loading, empty and error states used by every data screen (NFR-05).
import type { ReactNode } from 'react';
import { errorMessage } from '../lib/api.ts';

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-8 text-muted">
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-line-soft border-t-navy motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card my-4 p-5 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children ? <div className="mt-2 text-muted">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="my-4 rounded-xl border border-danger bg-danger-soft p-4 text-ink">
      <p className="font-semibold text-danger">Não foi possível carregar.</p>
      <p className="mt-1">{errorMessage(error)}</p>
      {onRetry ? (
        <button type="button" className="btn btn-secondary mt-3" onClick={onRetry}>
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}

export function FormAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-danger bg-danger-soft p-3 text-ink">
      {message}
    </div>
  );
}
