import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.ts';

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://user:pass@db:5432/petsearch',
  SESSION_SECRET: 'x'.repeat(32),
};

describe('config (PRV-05)', () => {
  it('uses development defaults outside production', () => {
    const config = loadConfig({ COOKIE_SECURE: '' });
    expect(config).toMatchObject({ port: 3000, cookieSecure: false, trustProxy: 0 });
    expect(config.databaseUrl).toContain('localhost');
  });

  it('requires a database URL and a long session secret in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ ...production, SESSION_SECRET: 'short' })).toThrow(
      /SESSION_SECRET: must have at least 32 characters/,
    );
    expect(loadConfig(production)).toMatchObject({ cookieSecure: true, trustProxy: 1 });
  });

  it('reads the proxy count, pool size and flags', () => {
    const config = loadConfig({
      ...production,
      TRUST_PROXY: '0',
      DATABASE_POOL_MAX: '4',
      COOKIE_SECURE: 'false',
    });
    expect(config).toMatchObject({ trustProxy: 0, databasePoolMax: 4, cookieSecure: false });
    expect(() => loadConfig({ ...production, TRUST_PROXY: 'yes' })).toThrow(/TRUST_PROXY/);
  });
});
