// Neighborhood list for notices, sightings and filters (FR-04, PRV-02).
// PROVISIONAL: the official list and its source are pending (docs/open-questions.md, OQ-11).
// Replace this list once the group provides it; keep the "outro" entry.

export interface Neighborhood {
  slug: string;
  name: string;
}

export const NEIGHBORHOODS: readonly Neighborhood[] = [
  { slug: 'centro', name: 'Centro' },
  { slug: 'cidade-nova', name: 'Cidade Nova' },
  { slug: 'jardim-esplanada', name: 'Jardim Esplanada' },
  { slug: 'jardim-morada-do-sol', name: 'Jardim Morada do Sol' },
  { slug: 'jardim-pau-preto', name: 'Jardim Pau Preto' },
  { slug: 'vila-furlan', name: 'Vila Furlan' },
  { slug: 'outro', name: 'Outro / não sei' },
];

export const NEIGHBORHOOD_SLUGS = NEIGHBORHOODS.map((n) => n.slug) as [string, ...string[]];

export function neighborhoodName(slug: string): string {
  return NEIGHBORHOODS.find((n) => n.slug === slug)?.name ?? slug;
}
