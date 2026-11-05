// Domain enums and their pt-BR labels (FR-03, FR-06, FR-15). Codes in English, labels in pt-BR (PRC-12).

export const NOTICE_TYPES = ['lost', 'found'] as const;
export type NoticeType = (typeof NOTICE_TYPES)[number];
export const NOTICE_TYPE_LABELS: Record<NoticeType, string> = {
  lost: 'Perdido',
  found: 'Encontrado',
};

export const NOTICE_STATUSES = ['open', 'reunited', 'closed'] as const;
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];
export const NOTICE_STATUS_LABELS: Record<NoticeStatus, string> = {
  open: 'Em aberto',
  reunited: 'Reencontrado',
  closed: 'Encerrado',
};

export const SPECIES = ['dog', 'cat', 'other'] as const;
export type Species = (typeof SPECIES)[number];
export const SPECIES_LABELS: Record<Species, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
  other: 'Outro',
};

export const SIZES = ['small', 'medium', 'large'] as const;
export type Size = (typeof SIZES)[number];
export const SIZE_LABELS: Record<Size, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
};

export const COAT_COLORS = [
  'black',
  'white',
  'brown',
  'caramel',
  'golden',
  'gray',
  'brindle',
  'spotted',
  'orange',
  'tricolor',
] as const;
export type CoatColor = (typeof COAT_COLORS)[number];
export const COAT_COLOR_LABELS: Record<CoatColor, string> = {
  black: 'Preto',
  white: 'Branco',
  brown: 'Marrom',
  caramel: 'Caramelo',
  golden: 'Dourado',
  gray: 'Cinza',
  brindle: 'Tigrado',
  spotted: 'Malhado',
  orange: 'Laranja',
  tricolor: 'Tricolor',
};

export const SEXES = ['male', 'female', 'unknown'] as const;
export type Sex = (typeof SEXES)[number];
export const SEX_LABELS: Record<Sex, string> = {
  male: 'Macho',
  female: 'Fêmea',
  unknown: 'Não sei',
};

export const MICROCHIP_OPTIONS = ['yes', 'no', 'unknown'] as const;
export type MicrochipOption = (typeof MICROCHIP_OPTIONS)[number];
export const MICROCHIP_LABELS: Record<MicrochipOption, string> = {
  yes: 'Sim',
  no: 'Não',
  unknown: 'Não sei',
};

export const SIGHTING_KINDS = ['sighting', 'message'] as const;
export type SightingKind = (typeof SIGHTING_KINDS)[number];
export const SIGHTING_KIND_LABELS: Record<SightingKind, string> = {
  sighting: 'Avistamento',
  message: 'Mensagem',
};

export const SIGHTING_OWNER_STATES = ['new', 'useful', 'dismissed'] as const;
export type SightingOwnerState = (typeof SIGHTING_OWNER_STATES)[number];
export const SIGHTING_OWNER_STATE_LABELS: Record<SightingOwnerState, string> = {
  new: 'Novo',
  useful: 'Útil',
  dismissed: 'Descartado',
};

export const ROLES = ['owner', 'moderator'] as const;
export type Role = (typeof ROLES)[number];

export const MODERATION_ACTIONS = ['hide', 'restore', 'delete'] as const;
export type ModerationActionType = (typeof MODERATION_ACTIONS)[number];

export const MODERATION_TARGETS = ['notice', 'sighting'] as const;
export type ModerationTarget = (typeof MODERATION_TARGETS)[number];

/** Version of the privacy policy that consent records refer to (PRV-03). */
export const PRIVACY_POLICY_VERSION = '2026-11-05';
