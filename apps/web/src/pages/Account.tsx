// Owner area: my notices, sign out, account deletion (FR-13, PRV-07).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { neighborhoodName } from '@petsearch/shared';
import { errorMessage } from '../lib/api.ts';
import { api, queryKeys } from '../lib/endpoints.ts';
import { formatDate, noticeTitle } from '../lib/format.ts';
import { useSession, useTitle } from '../lib/hooks.ts';
import { HiddenBadge, StatusBadge, TypeBadge } from '../components/Badges.tsx';
import { EmptyState, ErrorState, FormAlert, LoadingState } from '../components/StateViews.tsx';

export function Account() {
  useTitle('Minha conta');
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const notices = useQuery({ queryKey: queryKeys.myNotices, queryFn: api.myNotices });

  const signOut = useMutation({
    mutationFn: api.signOut,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, { user: null });
      navigate('/');
    },
  });
  const deleteAccount = useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, { user: null });
      navigate('/?conta-excluida=1');
    },
  });

  return (
    <>
      <h1 className="text-2xl font-bold">Minha conta</h1>
      {user ? <p className="mt-1 text-muted">Olá, {user.displayName}.</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/avisos/novo" className="btn btn-primary">
          Publicar aviso
        </Link>
        {user?.role === 'moderator' ? (
          <Link to="/moderacao" className="btn btn-secondary">
            Moderação
          </Link>
        ) : null}
      </div>

      <section aria-labelledby="my-notices" className="mt-6">
        <h2 id="my-notices" className="text-xl font-bold">
          Meus avisos
        </h2>
        {notices.isPending ? (
          <LoadingState />
        ) : notices.isError ? (
          <ErrorState error={notices.error} onRetry={() => void notices.refetch()} />
        ) : notices.data.length === 0 ? (
          <EmptyState title="Você ainda não publicou avisos." />
        ) : (
          <ul className="mt-3 grid list-none gap-3 p-0">
            {notices.data.map((notice) => (
              <li key={notice.id} className="card">
                <Link
                  to={`/minha-conta/avisos/${notice.id}`}
                  className="block p-3 text-ink no-underline"
                >
                  <div className="mb-1 flex flex-wrap gap-1">
                    <TypeBadge type={notice.type} />
                    <StatusBadge status={notice.status} />
                    {notice.hidden ? <HiddenBadge /> : null}
                  </div>
                  <span className="block font-semibold">{noticeTitle(notice)}</span>
                  <span className="block text-sm text-muted">
                    {neighborhoodName(notice.neighborhood)} · {formatDate(notice.eventDate)}
                  </span>
                  {notice.newSightings > 0 ? (
                    <span className="badge mt-2 bg-primary text-white">
                      {notice.newSightings}{' '}
                      {notice.newSightings === 1 ? 'novo avistamento' : 'novos avistamentos'}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="account-actions" className="mt-8">
        <h2 id="account-actions" className="text-xl font-bold">
          Conta
        </h2>
        <FormAlert message={signOut.isError ? errorMessage(signOut.error) : null} />
        <button
          type="button"
          className="btn btn-secondary btn-block mt-3"
          disabled={signOut.isPending}
          onClick={() => signOut.mutate()}
        >
          Sair
        </button>

        {!confirmDelete ? (
          <button
            type="button"
            className="btn btn-ghost btn-block mt-3 text-danger"
            onClick={() => setConfirmDelete(true)}
          >
            Excluir minha conta
          </button>
        ) : (
          <div
            role="alertdialog"
            aria-labelledby="delete-title"
            className="card mt-3 border-danger p-4"
          >
            <h3 id="delete-title" className="font-bold text-danger">
              Excluir conta e todos os avisos?
            </h3>
            <p className="mt-1">
              Seus dados, avisos, fotos e avistamentos recebidos serão apagados. Isso não pode ser
              desfeito.
            </p>
            <FormAlert message={deleteAccount.isError ? errorMessage(deleteAccount.error) : null} />
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
                disabled={deleteAccount.isPending}
                onClick={() => deleteAccount.mutate()}
              >
                Sim, excluir tudo
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
