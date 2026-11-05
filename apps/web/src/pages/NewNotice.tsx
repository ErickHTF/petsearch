// Three-step publish form (FR-01 to FR-06, FR-15, PRV-02, PRV-03).
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { FormProvider, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import {
  COAT_COLOR_LABELS,
  LIMITS,
  NOTICE_TYPE_LABELS,
  SIZE_LABELS,
  SPECIES_LABELS,
  neighborhoodName,
  noticeInputSchema,
  type NoticeType,
} from '@petsearch/shared';
import { api, queryKeys } from '../lib/endpoints.ts';
import { applyServerErrors } from '../lib/forms.ts';
import { formatDate } from '../lib/format.ts';
import { useTitle } from '../lib/hooks.ts';
import { CheckboxField, FieldError } from '../components/Fields.tsx';
import { AnimalFields, PlaceFields, TypeField } from '../components/NoticeFields.tsx';
import { FormAlert } from '../components/StateViews.tsx';

type FormValues = z.input<typeof noticeInputSchema>;

const STEPS = ['O animal', 'Onde e quando', 'Fotos e confirmação'] as const;

const STEP_FIELDS: FieldPath<FormValues>[][] = [
  [
    'type',
    'animal.name',
    'animal.species',
    'animal.size',
    'animal.coatColors',
    'animal.sex',
    'animal.hasMicrochip',
    'animal.distinctiveMarks',
  ],
  ['neighborhood', 'eventDate', 'description'],
];

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

function PhotoPicker({
  photos,
  onChange,
  error,
}: {
  photos: File[];
  onChange: (photos: File[]) => void;
  error?: string;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  function add(files: FileList | null) {
    setLocalError(null);
    const picked = Array.from(files ?? []);
    const invalid = picked.find((file) => !ACCEPTED_TYPES.includes(file.type));
    const tooBig = picked.find((file) => file.size > MAX_BYTES);
    if (invalid) return setLocalError('Envie fotos em JPG, PNG ou WebP.');
    if (tooBig) return setLocalError('Cada foto pode ter no máximo 8 MB.');
    const next = [...photos, ...picked];
    if (next.length > LIMITS.photosMax) setLocalError(`Envie no máximo ${LIMITS.photosMax} fotos.`);
    onChange(next.slice(0, LIMITS.photosMax));
  }

  const message = localError ?? error;
  return (
    <div className="mb-4">
      <label htmlFor="photos" className="mb-1 block font-semibold">
        Fotos do animal
      </label>
      <p id="photos-hint" className="mb-2 text-sm text-muted">
        De 1 a {LIMITS.photosMax} fotos. Evite mostrar pessoas, placas de carro ou número de casas.
        A localização gravada na foto é apagada ao publicar.
      </p>
      <input
        id="photos"
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        className="input"
        disabled={photos.length >= LIMITS.photosMax}
        aria-describedby={`photos-hint${message ? ' photos-error' : ''}`}
        aria-invalid={message ? true : undefined}
        onChange={(event) => {
          add(event.target.files);
          event.target.value = '';
        }}
      />
      <FieldError id="photos" error={message ?? undefined} />
      {photos.length ? (
        <ul className="mt-3 grid list-none grid-cols-3 gap-2 p-0">
          {photos.map((photo, index) => (
            <li key={`${photo.name}-${index}`} className="flex flex-col gap-1">
              {previews[index] ? (
                <img
                  src={previews[index]}
                  alt={`Prévia da foto ${index + 1}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ) : null}
              <button
                type="button"
                className="btn btn-ghost px-1 text-sm"
                onClick={() => onChange(photos.filter((_, i) => i !== index))}
              >
                Remover foto {index + 1}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Review({ values, photos }: { values: FormValues; photos: number }) {
  const animal = values.animal;
  const rows: [string, string][] = [
    ['Tipo', values.type ? NOTICE_TYPE_LABELS[values.type] : ''],
    ['Nome', animal?.name || 'Não informado'],
    ['Espécie', animal?.species ? SPECIES_LABELS[animal.species] : ''],
    ['Porte', animal?.size ? SIZE_LABELS[animal.size] : ''],
    ['Cores', (animal?.coatColors ?? []).map((c) => COAT_COLOR_LABELS[c]).join(', ')],
    ['Bairro', values.neighborhood ? neighborhoodName(values.neighborhood) : ''],
    ['Data', values.eventDate ? formatDate(values.eventDate) : ''],
    ['Fotos', String(photos)],
  ];
  return (
    <section aria-labelledby="review" className="card mb-4 p-4">
      <h2 id="review" className="text-lg font-bold">
        Confira antes de publicar
      </h2>
      <dl className="mt-2 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-semibold">{label}</dt>
            <dd className="m-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function NewNotice() {
  useTitle('Publicar aviso');
  const [params] = useSearchParams();
  const initialType = params.get('tipo');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<FormValues, unknown, z.output<typeof noticeInputSchema>>({
    resolver: zodResolver(noticeInputSchema),
    defaultValues: {
      type:
        initialType === 'lost' || initialType === 'found' ? (initialType as NoticeType) : undefined,
      animal: { coatColors: [] },
    },
  });
  const { handleSubmit, trigger, register, setError, watch, formState } = form;

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  async function next() {
    const fields = STEP_FIELDS[step] ?? [];
    if (await trigger(fields, { shouldFocus: true })) setStep((s) => s + 1);
  }

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(null);
      if (photos.length === 0) {
        setPhotoError('Adicione pelo menos uma foto.');
        return;
      }
      try {
        const notice = await api.createNotice(values, photos);
        await queryClient.invalidateQueries({ queryKey: queryKeys.myNotices });
        await queryClient.invalidateQueries({ queryKey: ['notices'] });
        navigate(`/minha-conta/avisos/${notice.id}?publicado=1`);
      } catch (error) {
        const message = applyServerErrors(error, setError);
        setFormError(message);
        const fields = (error as { fields?: Record<string, string> }).fields;
        if (fields?.photos) setPhotoError(fields.photos);
        // Go back to the first step with a server-side field error.
        const firstStep = STEP_FIELDS.findIndex((stepFields) =>
          stepFields.some((field) => fields?.[field]),
        );
        if (firstStep >= 0) setStep(firstStep);
      }
    },
    () => {
      if (photos.length === 0) setPhotoError('Adicione pelo menos uma foto.');
      const errors = form.formState.errors;
      const firstStep = STEP_FIELDS.findIndex((stepFields) =>
        stepFields.some((field) => form.getFieldState(field).invalid),
      );
      if (firstStep >= 0 && !errors.consent) setStep(firstStep);
    },
  );

  const type = watch('type');

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold">
        Publicar aviso
      </h1>
      <p className="mt-1 text-muted" aria-live="polite">
        Etapa {step + 1} de {STEPS.length}: {STEPS[step]}
      </p>
      <ol aria-hidden="true" className="mt-2 flex list-none gap-1 p-0">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-line-soft'}`}
          />
        ))}
      </ol>

      <FormProvider {...form}>
        <form noValidate onSubmit={onSubmit} className="mt-4">
          <FormAlert message={formError} />
          <div className="mt-3">
            <div hidden={step !== 0}>
              <TypeField />
              <AnimalFields />
            </div>
            <div hidden={step !== 1}>
              <PlaceFields type={type} />
            </div>
            <div hidden={step !== 2}>
              <PhotoPicker
                photos={photos}
                onChange={(next) => {
                  setPhotos(next);
                  if (next.length) setPhotoError(undefined);
                }}
                error={photoError}
              />
              <Review values={watch()} photos={photos.length} />
              <CheckboxField
                label="Autorizo a publicação das fotos e dos dados deste aviso no PETSEARCH, conforme a política de privacidade."
                error={formState.errors.consent?.message}
                {...register('consent')}
              />
            </div>
          </div>

          <div className="mt-2 flex gap-3">
            {step > 0 ? (
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => setStep(step - 1)}
              >
                Voltar
              </button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary flex-1" onClick={() => void next()}>
                Continuar
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={formState.isSubmitting}
              >
                {formState.isSubmitting ? 'Publicando…' : 'Publicar aviso'}
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </>
  );
}
