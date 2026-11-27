import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.ts';

const databaseUrl = 'postgres://extracker:secret@localhost:5432/extracker';

describe('loadConfig', () => {
  it('applies defaults when only DATABASE_URL is set', () => {
    expect(loadConfig({ DATABASE_URL: databaseUrl })).toEqual({
      DATABASE_URL: databaseUrl,
      API_HOST: '0.0.0.0',
      API_PORT: 3000,
      LOG_LEVEL: 'info',
      DEFAULT_CURRENCY: 'EUR',
      DEFAULT_LOCALE: 'en-IE',
    });
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });

  it('rejects an unknown currency and a malformed locale', () => {
    expect(() => loadConfig({ DATABASE_URL: databaseUrl, DEFAULT_CURRENCY: 'XYZ' })).toThrow(/DEFAULT_CURRENCY/);
    expect(() => loadConfig({ DATABASE_URL: databaseUrl, DEFAULT_LOCALE: 'not a locale' })).toThrow(/DEFAULT_LOCALE/);
  });
});
