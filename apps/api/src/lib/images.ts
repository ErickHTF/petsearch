// Image pipeline: re-encode with sharp (drops EXIF/GPS, PRV-08), resize (NFR-11), store in PostgreSQL.
import multer from 'multer';
import sharp from 'sharp';
import { HttpError } from './errors.ts';

const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 1280;

export function imageUpload(maxFiles: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: maxFiles, fields: 10, fieldSize: 20_000 },
    fileFilter: (_req, file, cb) => {
      if (ACCEPTED.has(file.mimetype)) cb(null, true);
      else cb(new HttpError(400, 'Envie fotos em JPG, PNG ou WebP.'));
    },
  });
}

export async function processImage(input: Buffer) {
  try {
    // sharp drops all metadata (EXIF, GPS, ICC) unless asked to keep it.
    const { data, info } = await sharp(input, { failOn: 'error' })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    throw new HttpError(400, 'Não foi possível ler uma das fotos. Tente outra imagem.', {
      photos: 'Não foi possível ler uma das fotos. Tente outra imagem.',
    });
  }
}

export interface ImageInput {
  buffer: Buffer;
  alt: string;
  position: number;
}

export type ProcessedImage = Awaited<ReturnType<typeof processImage>> & {
  alt: string;
  position: number;
};

export async function processAll(inputs: ImageInput[]): Promise<ProcessedImage[]> {
  const out: ProcessedImage[] = [];
  for (const input of inputs) {
    out.push({ ...(await processImage(input.buffer)), alt: input.alt, position: input.position });
  }
  return out;
}

export function imageRows(
  noticeId: string,
  visibility: 'public' | 'private',
  processed: ProcessedImage[],
) {
  return processed.map((image) => ({
    noticeId,
    visibility,
    position: image.position,
    alt: image.alt,
    width: image.width,
    height: image.height,
    content: image.data,
  }));
}
