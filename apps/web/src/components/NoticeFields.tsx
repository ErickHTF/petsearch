// Notice form sections shared by the publish and edit screens (FR-01 to FR-06, FR-15, PRV-02).
import { useFormContext } from 'react-hook-form';
import type { z } from 'zod';
import {
  COAT_COLORS,
  COAT_COLOR_LABELS,
  LIMITS,
  MICROCHIP_LABELS,
  MICROCHIP_OPTIONS,
  NEIGHBORHOODS,
  NOTICE_TYPES,
  SEXES,
  SEX_LABELS,
  SIZES,
  SIZE_LABELS,
  SPECIES,
  SPECIES_LABELS,
  todayIso,
  type noticeUpdateSchema,
} from '@petsearch/shared';
import { Choice, ChoiceGroup, SelectField, TextAreaField, TextField } from './Fields.tsx';

type NoticeFormShape = z.input<typeof noticeUpdateSchema>;

export const PRIVACY_HINT =
  'Não escreva endereço, telefone ou e-mail. O contato acontece pela mensagem protegida.';

export const NEIGHBORHOOD_OPTIONS = NEIGHBORHOODS.map((n) => ({ value: n.slug, label: n.name }));

export const TYPE_CHOICE_LABELS = {
  lost: 'Perdi meu animal',
  found: 'Encontrei um animal',
} as const;

export function TypeField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<NoticeFormShape>();
  return (
    <ChoiceGroup legend="Tipo de aviso" error={errors.type?.message}>
      {NOTICE_TYPES.map((type) => (
        <Choice
          key={type}
          type="radio"
          value={type}
          label={TYPE_CHOICE_LABELS[type]}
          {...register('type')}
        />
      ))}
    </ChoiceGroup>
  );
}

export function AnimalFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<NoticeFormShape>();
  const animalErrors = errors.animal;
  return (
    <>
      <TextField
        label="Nome do animal"
        optional
        hint="Se não souber, deixe em branco."
        maxLength={LIMITS.nameMax}
        autoComplete="off"
        error={animalErrors?.name?.message}
        {...register('animal.name')}
      />
      <SelectField
        label="Espécie"
        placeholder="Escolha"
        options={SPECIES.map((value) => ({ value, label: SPECIES_LABELS[value] }))}
        error={animalErrors?.species?.message}
        {...register('animal.species')}
      />
      <SelectField
        label="Porte"
        placeholder="Escolha"
        options={SIZES.map((value) => ({ value, label: SIZE_LABELS[value] }))}
        error={animalErrors?.size?.message}
        {...register('animal.size')}
      />
      <ChoiceGroup
        legend="Cores da pelagem"
        hint="Escolha de 1 a 3 cores."
        error={animalErrors?.coatColors?.message ?? animalErrors?.coatColors?.root?.message}
      >
        {COAT_COLORS.map((color) => (
          <Choice
            key={color}
            type="checkbox"
            value={color}
            label={COAT_COLOR_LABELS[color]}
            {...register('animal.coatColors')}
          />
        ))}
      </ChoiceGroup>
      <ChoiceGroup legend="Sexo" error={animalErrors?.sex?.message}>
        {SEXES.map((sex) => (
          <Choice
            key={sex}
            type="radio"
            value={sex}
            label={SEX_LABELS[sex]}
            {...register('animal.sex')}
          />
        ))}
      </ChoiceGroup>
      <ChoiceGroup
        legend="Tem microchip?"
        hint="Nunca informe o número do microchip."
        error={animalErrors?.hasMicrochip?.message}
      >
        {MICROCHIP_OPTIONS.map((option) => (
          <Choice
            key={option}
            type="radio"
            value={option}
            label={MICROCHIP_LABELS[option]}
            {...register('animal.hasMicrochip')}
          />
        ))}
      </ChoiceGroup>
      <TextAreaField
        label="Sinais particulares"
        optional
        hint={`Coleira, cicatrizes, manchas. ${PRIVACY_HINT}`}
        maxLength={LIMITS.marksMax}
        rows={3}
        error={animalErrors?.distinctiveMarks?.message}
        {...register('animal.distinctiveMarks')}
      />
    </>
  );
}

export function PlaceFields({ type }: { type?: string }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<NoticeFormShape>();
  return (
    <>
      <SelectField
        label="Bairro"
        hint="Informe só o bairro. Endereço exato não é publicado."
        placeholder="Escolha o bairro"
        options={NEIGHBORHOOD_OPTIONS}
        error={errors.neighborhood?.message}
        {...register('neighborhood')}
      />
      <TextField
        label={type === 'found' ? 'Data em que encontrou' : 'Data em que se perdeu'}
        type="date"
        max={todayIso()}
        error={errors.eventDate?.message}
        {...register('eventDate')}
      />
      <TextAreaField
        label="Descrição"
        optional
        hint={`Comportamento, como se perdeu, se atende pelo nome. ${PRIVACY_HINT}`}
        maxLength={LIMITS.descriptionMax}
        rows={4}
        error={errors.description?.message}
        {...register('description')}
      />
    </>
  );
}
