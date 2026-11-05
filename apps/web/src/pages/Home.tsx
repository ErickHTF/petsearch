import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api, queryKeys } from '../lib/endpoints.ts';
import { useTitle } from '../lib/hooks.ts';
import { NoticeCard } from '../components/NoticeCard.tsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.tsx';

export function Home() {
  useTitle('');
  const latest = useQuery({
    queryKey: queryKeys.notices({ page: 1 }),
    queryFn: () => api.listNotices({ page: 1 }),
  });

  return (
    <>
      <h1 className="text-2xl font-bold">Animais perdidos e encontrados em Indaiatuba</h1>
      <p className="mt-2 text-muted">
        Publique um aviso, procure por bairro e características e avise quem procura o animal, sem
        expor telefone nem endereço.
      </p>

      <div className="mt-5 grid gap-3">
        <Link to="/avisos/novo?tipo=lost" className="btn btn-primary btn-block">
          Perdi meu animal
        </Link>
        <Link to="/avisos/novo?tipo=found" className="btn btn-secondary btn-block">
          Encontrei um animal
        </Link>
        <Link to="/avisos" className="btn btn-secondary btn-block">
          Vi um animal: procurar avisos
        </Link>
      </div>

      <section aria-labelledby="latest-heading" className="mt-8">
        <h2 id="latest-heading" className="text-xl font-bold">
          Avisos recentes
        </h2>
        {latest.isPending ? (
          <LoadingState />
        ) : latest.isError ? (
          <ErrorState error={latest.error} onRetry={() => void latest.refetch()} />
        ) : latest.data.items.length === 0 ? (
          <EmptyState title="Nenhum aviso publicado ainda." />
        ) : (
          <>
            <ul className="mt-3 grid list-none gap-3 p-0">
              {latest.data.items.slice(0, 4).map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </ul>
            <Link to="/avisos" className="btn btn-ghost mt-2">
              Ver todos os avisos
            </Link>
          </>
        )}
      </section>
    </>
  );
}
