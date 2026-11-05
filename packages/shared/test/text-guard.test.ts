import { describe, expect, it } from 'vitest';
import { findSensitiveText } from '../src/text-guard.ts';

describe('findSensitiveText (PRV-02)', () => {
  it.each([
    ['Ligue (19) 99876-5432', ['phone']],
    ['whats 19998765432', ['phone']],
    ['fone 3875-1234', ['phone']],
    ['CEP 13330-000', ['cep']],
    ['me chama em fulano@exemplo.com', ['email']],
    ['Fugiu na Rua das Flores', ['address']],
    ['perto da Av. Presidente Vargas', ['address']],
    ['casa nº 120', ['address']],
    ['fugiu pela rua e depois foi para a Rua Sete', ['address']],
  ])('flags %s', (text, expected) => {
    expect(findSensitiveText(text)).toEqual(expected);
  });

  it.each([
    'Cadela dócil, coleira vermelha, cicatriz na orelha',
    'Fugiu pela rua de casa no dia 03/11/2026',
    'Tem 2 anos e pesa 12 kg',
    'Visto perto da praça central',
    'Medo de fogos, atende pelo nome',
  ])('allows %s', (text) => {
    expect(findSensitiveText(text)).toEqual([]);
  });
});
