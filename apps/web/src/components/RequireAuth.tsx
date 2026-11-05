import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useSession } from '../lib/hooks.ts';
import { ErrorState, LoadingState } from './StateViews.tsx';

/** Guards owner and moderator routes (PRV-04). The API enforces the same rules. */
export function RequireAuth({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: 'moderator';
}) {
  const { user, isPending, isError, error, refetch } = useSession();
  const location = useLocation();

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!user) {
    const back = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/entrar?voltar=${back}`} replace />;
  }
  if (requiredRole === 'moderator' && user.role !== 'moderator') {
    return (
      <div role="alert" className="card p-4">
        <h1 className="text-xl font-bold">Acesso restrito</h1>
        <p className="mt-2">Esta área é exclusiva da moderação.</p>
      </div>
    );
  }
  return children;
}
