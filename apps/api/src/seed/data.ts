// Fictional demo data (FR-21, PRC-07, PRV-06). Every notice is flagged isFictional and shown with
// an "Exemplo fictício" badge. Names, accounts and texts are invented; images are generated shapes.
import type { NoticeInput } from '@petsearch/shared';

export const DEMO_DOMAIN = 'exemplo.test';
export const DEMO_OWNER_EMAIL = `tutora.demo@${DEMO_DOMAIN}`;
export const DEMO_MODERATOR_EMAIL = `moderacao.demo@${DEMO_DOMAIN}`;

export type SeedNotice = Omit<NoticeInput, 'consent' | 'photoAlts'> & { alt: string };

export const SEED_NOTICES: SeedNotice[] = [
  {
    type: 'lost',
    animal: {
      name: 'Luna',
      species: 'dog',
      size: 'medium',
      coatColors: ['caramel'],
      sex: 'female',
      distinctiveMarks: 'Coleira vermelha, orelha esquerda levemente caída.',
      hasMicrochip: 'unknown',
    },
    neighborhood: 'centro',
    eventDate: '2026-11-01',
    description: 'Cadela dócil, atende pelo nome. Exemplo fictício do slide do IFCIÊNCIA.',
    alt: 'Ilustração de exemplo: pata sobre fundo caramelo',
  },
  {
    type: 'lost',
    animal: {
      name: 'Thor',
      species: 'dog',
      size: 'large',
      coatColors: ['black'],
      sex: 'male',
      distinctiveMarks: 'Mancha branca no peito.',
      hasMicrochip: 'yes',
    },
    neighborhood: 'cidade-nova',
    eventDate: '2026-10-28',
    description: 'Fugiu assustado com fogos. Exemplo fictício.',
    alt: 'Ilustração de exemplo: pata sobre fundo preto',
  },
  {
    type: 'lost',
    animal: {
      name: 'Mimi',
      species: 'cat',
      size: 'small',
      coatColors: ['gray', 'white'],
      sex: 'female',
      hasMicrochip: 'no',
    },
    neighborhood: 'jardim-esplanada',
    eventDate: '2026-10-30',
    description: 'Gata castrada, muito tímida. Exemplo fictício.',
    alt: 'Ilustração de exemplo: pata sobre fundo cinza',
  },
  {
    type: 'found',
    animal: {
      species: 'dog',
      size: 'small',
      coatColors: ['brown'],
      sex: 'unknown',
      distinctiveMarks: 'Sem coleira.',
      hasMicrochip: 'unknown',
    },
    neighborhood: 'jardim-morada-do-sol',
    eventDate: '2026-11-03',
    description: 'Cachorro encontrado perto de uma praça, está bem. Exemplo fictício.',
    alt: 'Ilustração de exemplo: pata sobre fundo marrom',
  },
  {
    type: 'lost',
    animal: {
      name: 'Pipoca',
      species: 'dog',
      size: 'small',
      coatColors: ['white', 'brown'],
      sex: 'female',
      hasMicrochip: 'no',
    },
    neighborhood: 'vila-furlan',
    eventDate: '2026-10-25',
    description: 'Usa roupinha azul. Exemplo fictício.',
    alt: 'Ilustração de exemplo: pata sobre fundo branco',
  },
  {
    type: 'found',
    animal: {
      species: 'cat',
      size: 'medium',
      coatColors: ['orange'],
      sex: 'male',
      hasMicrochip: 'unknown',
    },
    neighborhood: 'jardim-pau-preto',
    eventDate: '2026-11-02',
    description: 'Gato laranja dócil apareceu no quintal. Exemplo fictício.',
    alt: 'Ilustração de exemplo: pata sobre fundo laranja',
  },
  {
    type: 'lost',
    animal: {
      name: 'Bento',
      species: 'dog',
      size: 'medium',
      coatColors: ['golden'],
      sex: 'male',
      hasMicrochip: 'yes',
    },
    neighborhood: 'centro',
    eventDate: '2026-10-22',
    description: 'Idoso, anda devagar. Exemplo fictício.',
    alt: 'Ilustração de exemplo: pata sobre fundo dourado',
  },
  {
    type: 'lost',
    animal: {
      name: 'Nina',
      species: 'cat',
      size: 'small',
      coatColors: ['tricolor'],
      sex: 'female',
      hasMicrochip: 'unknown',
    },
    neighborhood: 'cidade-nova',
    eventDate: '2026-11-04',
    description: 'Gata tricolor de olhos verdes. Exemplo fictício.',
    alt: 'Ilustração de exemplo: pata sobre fundo tricolor',
  },
];
