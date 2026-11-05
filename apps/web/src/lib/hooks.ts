import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, queryKeys } from './endpoints.ts';

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | PETSEARCH` : 'PETSEARCH';
  }, [title]);
}

export function useSession() {
  const query = useQuery({ queryKey: queryKeys.session, queryFn: api.session, staleTime: 60_000 });
  return { ...query, user: query.data?.user ?? null };
}
