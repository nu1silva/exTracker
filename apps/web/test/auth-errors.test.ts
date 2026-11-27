import { describe, expect, it } from 'vitest';
import { messageForAuthError, unknownErrorMessage } from '../src/auth-errors.ts';

describe('messageForAuthError', () => {
  it('turns a known code into a sentence', () => {
    expect(messageForAuthError({ code: 'INVALID_EMAIL_OR_PASSWORD', status: 401 })).toBe(
      'The email or password is wrong.',
    );
  });

  it('tells the reader to check APP_URL for INVALID_ORIGIN', () => {
    expect(messageForAuthError({ code: 'INVALID_ORIGIN', status: 403 })).toContain('APP_URL');
  });

  it('explains HTTP 429, which comes without a code', () => {
    expect(messageForAuthError({ status: 429 })).toMatch(/too many attempts/i);
  });

  it('has a general message for anything unknown', () => {
    expect(messageForAuthError({ code: 'SOMETHING_NEW', status: 400 })).toBe(unknownErrorMessage);
    expect(messageForAuthError({ status: 500 })).toBe(unknownErrorMessage);
  });
});
