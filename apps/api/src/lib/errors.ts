import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError, type ZodType } from 'zod';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFound = () => new HttpError(404, 'Não encontrado.');

export function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw result.error;
}

function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  return fields;
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Não encontrado.' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Verifique os campos destacados.', fields: zodFields(err) });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, fields: err.fields });
    return;
  }
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Cada foto pode ter no máximo 8 MB.'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Envie no máximo 3 fotos.'
          : 'Não foi possível receber as fotos.';
    res.status(400).json({ error: message });
    return;
  }
  if (err?.type === 'entity.parse.failed' || err?.type === 'entity.too.large') {
    res.status(400).json({ error: 'Requisição inválida.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Erro inesperado. Tente novamente.' });
};
