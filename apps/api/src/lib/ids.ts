import { notFound } from './errors.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates a route id; malformed ids are treated as not found. */
export function uuidParam(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) throw notFound();
  return value.toLowerCase();
}
