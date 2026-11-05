// Blocks exact-location and contact data in free text (PRV-01, PRV-02).

export type SensitiveKind = 'email' | 'cep' | 'phone' | 'address';

export const SENSITIVE_KIND_LABELS: Record<SensitiveKind, string> = {
  email: 'e-mail',
  cep: 'CEP',
  phone: 'telefone',
  address: 'endereço',
};

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const CEP = /\b\d{5}-\d{3}\b/;
// Digit runs (allowing spaces, dots, dashes and parentheses) with 8 to 13 digits.
const DIGIT_RUN = /\+?\(?\d[\d\s().-]{6,}\d/g;
// Street keyword followed by a capitalized name or a number, e.g. "Rua das Flores", "Av. 7".
const STREET =
  /(?:^|[\s,(])(?:rua|r\.|avenida|av\.?|travessa|tv\.|alameda|al\.|estrada|rodovia|praça|pça\.?)\s+(?:d[aeo]s?\s+)?[A-ZÀ-Úa-zà-ú0-9]/gi;
const HOUSE_NUMBER = /(?:^|[\s,(])(?:nº|n°|n\.º|número|numero)\s*\d+/i;

function hasStreetName(text: string): boolean {
  // The keyword is case-insensitive, but the name after it must start with a capital or a digit,
  // so "fugiu pela rua de casa" passes and "Rua das Flores" is blocked.
  for (const match of text.matchAll(STREET)) {
    if (/[A-ZÀ-Ú0-9]/.test(match[0].at(-1) ?? '')) return true;
  }
  return false;
}

export function findSensitiveText(text: string): SensitiveKind[] {
  const found = new Set<SensitiveKind>();
  if (EMAIL.test(text)) found.add('email');
  if (CEP.test(text)) found.add('cep');
  for (const run of text.match(DIGIT_RUN) ?? []) {
    const digits = run.replace(/\D/g, '').length;
    if (digits >= 8 && digits <= 13 && !CEP.test(run)) found.add('phone');
  }
  if (hasStreetName(text) || HOUSE_NUMBER.test(text)) found.add('address');
  return [...found];
}

export function sensitiveTextMessage(kinds: SensitiveKind[]): string {
  const list = kinds.map((kind) => SENSITIVE_KIND_LABELS[kind]).join(', ');
  return `Não informe ${list}. Use apenas o bairro e a mensagem protegida.`;
}
