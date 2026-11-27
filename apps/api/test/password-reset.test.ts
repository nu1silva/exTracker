import { afterEach, describe, expect, it } from 'vitest';
import { PasswordResetError, resetPassword } from '../src/password-reset.ts';
import { PASSWORD, buildTestApp, getMe, postJson, signUp } from './support.ts';

const NEW_PASSWORD = 'a brand new passphrase';

describe('resetPassword', () => {
  let built: ReturnType<typeof buildTestApp> | undefined;

  afterEach(async () => {
    await built?.app.close();
  });

  const signIn = (password: string) =>
    postJson(built!.app, '/api/auth/sign-in/email', { email: 'sam@example.com', password });

  it('replaces the password and ends every session', async () => {
    built = buildTestApp();
    const firstSession = await signUp(built.app);
    expect((await signIn(PASSWORD)).statusCode).toBe(200);

    // Case-insensitive, like sign-in.
    await expect(resetPassword(built.auth, 'Sam@Example.com', NEW_PASSWORD)).resolves.toEqual({
      email: 'sam@example.com',
    });

    expect((await getMe(built.app, firstSession)).statusCode).toBe(401);
    expect((await signIn(PASSWORD)).statusCode).toBe(401);
    expect((await signIn(NEW_PASSWORD)).statusCode).toBe(200);
  });

  it('rejects an unknown email', async () => {
    built = buildTestApp();
    await expect(resetPassword(built.auth, 'nobody@example.com', NEW_PASSWORD)).rejects.toThrow(PasswordResetError);
  });

  it.each([
    ['too short', 'x'.repeat(11)],
    ['too long', 'x'.repeat(129)],
  ])('rejects a password that is %s, and keeps the old one', async (_label, password) => {
    built = buildTestApp();
    await signUp(built.app);

    await expect(resetPassword(built.auth, 'sam@example.com', password)).rejects.toThrow(PasswordResetError);
    expect((await signIn(PASSWORD)).statusCode).toBe(200);
  });
});
