import { describe, expect, it } from 'vitest';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  meResponseSchema,
  signInInputSchema,
  signUpInputSchema,
} from '../src/auth.ts';

const email = 'sam@example.com';
const passwordOfLength = (length: number) => 'x'.repeat(length);

describe.each([
  ['signUpInputSchema', signUpInputSchema, { name: 'Sam' }],
  ['signInInputSchema', signInInputSchema, {}],
] as const)('%s', (_name, schema, extra) => {
  it('accepts passwords at both length limits', () => {
    expect(schema.safeParse({ ...extra, email, password: passwordOfLength(PASSWORD_MIN_LENGTH) }).success).toBe(true);
    expect(schema.safeParse({ ...extra, email, password: passwordOfLength(PASSWORD_MAX_LENGTH) }).success).toBe(true);
  });

  it('rejects passwords outside the length limits', () => {
    expect(schema.safeParse({ ...extra, email, password: passwordOfLength(PASSWORD_MIN_LENGTH - 1) }).success).toBe(false);
    expect(schema.safeParse({ ...extra, email, password: passwordOfLength(PASSWORD_MAX_LENGTH + 1) }).success).toBe(false);
  });

  it('trims the email and rejects one that is not an address', () => {
    const password = passwordOfLength(PASSWORD_MIN_LENGTH);
    expect(schema.parse({ ...extra, email: `  ${email} `, password }).email).toBe(email);
    expect(schema.safeParse({ ...extra, email: 'not-an-email', password }).success).toBe(false);
  });
});

describe('signUpInputSchema', () => {
  it('requires a name of 1 to 100 characters', () => {
    const password = passwordOfLength(PASSWORD_MIN_LENGTH);
    expect(signUpInputSchema.safeParse({ name: '  ', email, password }).success).toBe(false);
    expect(signUpInputSchema.safeParse({ name: 'x'.repeat(101), email, password }).success).toBe(false);
  });
});

describe('meResponseSchema', () => {
  const me = {
    id: '0b6e9f1c-3f3a-4f43-9d2c-6a1f6b2f9e10',
    name: 'Sam',
    email,
    baseCurrency: 'EUR',
    locale: 'en-IE',
  };

  it('accepts a user', () => {
    expect(meResponseSchema.parse(me)).toEqual(me);
  });

  it('refuses an unknown currency', () => {
    expect(meResponseSchema.safeParse({ ...me, baseCurrency: 'XYZ' }).success).toBe(false);
  });
});
