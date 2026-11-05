import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiRequestError, errorMessage } from './api.ts';

/** Shows server-side field errors (ApiError.fields) on the matching inputs; returns the form message. */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string {
  if (error instanceof ApiRequestError && error.fields) {
    for (const [path, message] of Object.entries(error.fields)) {
      setError(path as Path<T>, { type: 'server', message });
    }
  }
  return errorMessage(error);
}
