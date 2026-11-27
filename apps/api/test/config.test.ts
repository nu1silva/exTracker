import { describe, expect, it } from 'vitest';
import { loadConfig, loadMigrateConfig } from '../src/config.ts';

const databaseUrl = 'postgres://extracker:secret@localhost:5432/extracker';
const required = {
  DATABASE_URL: databaseUrl,
  APP_URL: 'http://localhost:8080',
  AUTH_SECRET: 'a'.repeat(32),
};

describe('loadConfig', () => {
  it('applies defaults when only the required variables are set', () => {
    expect(loadConfig(required)).toEqual({
      ...required,
      API_HOST: '0.0.0.0',
      API_PORT: 3000,
      LOG_LEVEL: 'info',
      AUTH_SIGNUP_ENABLED: false,
      DEFAULT_CURRENCY: 'EUR',
      DEFAULT_LOCALE: 'en-IE',
    });
  });

  it.each(['DATABASE_URL', 'APP_URL', 'AUTH_SECRET'] as const)('rejects a missing %s', (name) => {
    const { [name]: _missing, ...env } = required;
    expect(() => loadConfig(env)).toThrow(new RegExp(name));
  });

  it('rejects an auth secret shorter than 32 characters', () => {
    expect(() => loadConfig({ ...required, AUTH_SECRET: 'a'.repeat(31) })).toThrow(/AUTH_SECRET/);
  });

  it('accepts an http or https origin and drops a trailing slash', () => {
    expect(loadConfig({ ...required, APP_URL: 'https://money.example.com/' }).APP_URL).toBe('https://money.example.com');
  });

  it('rejects an APP_URL that is not an http origin', () => {
    expect(() => loadConfig({ ...required, APP_URL: 'localhost:8080' })).toThrow(/APP_URL/);
    expect(() => loadConfig({ ...required, APP_URL: 'ftp://example.com' })).toThrow(/APP_URL/);
    expect(() => loadConfig({ ...required, APP_URL: 'https://example.com/app' })).toThrow(/APP_URL/);
  });

  it('opens sign-up only when AUTH_SIGNUP_ENABLED is true', () => {
    expect(loadConfig({ ...required, AUTH_SIGNUP_ENABLED: 'true' }).AUTH_SIGNUP_ENABLED).toBe(true);
    expect(loadConfig({ ...required, AUTH_SIGNUP_ENABLED: 'false' }).AUTH_SIGNUP_ENABLED).toBe(false);
    expect(() => loadConfig({ ...required, AUTH_SIGNUP_ENABLED: 'sometimes' })).toThrow(/AUTH_SIGNUP_ENABLED/);
  });

  it('rejects an unknown currency and a malformed locale', () => {
    expect(() => loadConfig({ ...required, DEFAULT_CURRENCY: 'XYZ' })).toThrow(/DEFAULT_CURRENCY/);
    expect(() => loadConfig({ ...required, DEFAULT_LOCALE: 'not a locale' })).toThrow(/DEFAULT_LOCALE/);
  });
});

describe('loadMigrateConfig', () => {
  it('needs only DATABASE_URL', () => {
    expect(loadMigrateConfig({ DATABASE_URL: databaseUrl })).toEqual({ DATABASE_URL: databaseUrl });
    expect(() => loadMigrateConfig({})).toThrow(/DATABASE_URL/);
  });
});
