import { passwordSchema } from '@extracker/shared';
import type { Auth } from './auth.ts';

/** A reason the reset cannot go ahead, worded for the person running the command. */
export class PasswordResetError extends Error {
  override name = 'PasswordResetError';
}

/**
 * Sets a new password for the user with this email and ends all of their sessions.
 *
 * Uses Better Auth's internal adapter (auth.$context), which is not a documented API. The tests
 * in test/password-reset.test.ts catch it if an upgrade changes it.
 */
export async function resetPassword(auth: Auth, email: string, newPassword: string): Promise<{ email: string }> {
  const password = passwordSchema.safeParse(newPassword);
  if (!password.success) throw new PasswordResetError(password.error.issues[0]?.message ?? 'Invalid password');

  const context = await auth.$context;
  // Matches the email case-insensitively, as sign-in does.
  const found = await context.internalAdapter.findUserByEmail(email.trim());
  if (!found) throw new PasswordResetError(`No user has the email ${email}`);

  const { user } = found;
  // updatePassword changes the email-and-password sign-in, and silently does nothing without one.
  const accounts = await context.internalAdapter.findAccounts(user.id);
  if (!accounts.some((account) => account.providerId === 'credential' && account.accountId === user.id)) {
    throw new PasswordResetError(`${user.email} does not sign in with a password`);
  }

  await context.internalAdapter.updatePassword(user.id, await context.password.hash(password.data));
  await context.internalAdapter.deleteUserSessions(user.id);
  return { email: user.email };
}
