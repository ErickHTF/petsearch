// Fetch client for the API contract in docs/api.md.
import type { ApiError } from '@petsearch/shared';

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: string;
  json?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  } else if (options.formData) {
    body = options.formData;
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      credentials: 'same-origin',
      signal: options.signal,
    });
  } catch {
    throw new ApiRequestError(0, 'Sem conexão. Verifique a internet e tente de novo.');
  }

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data as Partial<ApiError> | null;
    throw new ApiRequestError(
      response.status,
      error?.error ?? 'Erro inesperado. Tente novamente.',
      error?.fields,
    );
  }
  return data as T;
}

export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export function imageUrl(id: string): string {
  return `/api/images/${id}`;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  return 'Erro inesperado. Tente novamente.';
}
