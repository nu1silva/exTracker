import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@extracker/shared';

/** The parts of a Better Auth client error that matter here. */
export interface AuthErrorLike {
  code?: string | undefined;
  status?: number | undefined;
}

const originMessage =
  'This exTracker only accepts sign-ins from the address it was set up with. Open it at that address, ' +
  'or ask the person who runs it to check APP_URL.';

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'The email or password is wrong.',
  INVALID_EMAIL: 'Enter a valid email address.',
  INVALID_PASSWORD: 'The email or password is wrong.',
  PASSWORD_TOO_SHORT: `Use at least ${PASSWORD_MIN_LENGTH} characters for the password.`,
  PASSWORD_TOO_LONG: `Use at most ${PASSWORD_MAX_LENGTH} characters for the password.`,
  USER_ALREADY_EXISTS: 'An account with this email already exists. Sign in instead.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'An account with this email already exists. Sign in instead.',
  EMAIL_PASSWORD_SIGN_UP_DISABLED: 'Sign-up is closed on this server.',
  INVALID_ORIGIN: originMessage,
  MISSING_OR_NULL_ORIGIN: originMessage,
};

export const unknownErrorMessage = 'Something went wrong. Try again.';
export const networkErrorMessage = 'Cannot reach exTracker. Check your connection and try again.';

/** A plain sentence for an error from sign-in or sign-up. */
export function messageForAuthError(error: AuthErrorLike): string {
  // Better Auth's rate limiter answers 429 with no code.
  if (error.status === 429) return 'Too many attempts. Wait a minute, then try again.';
  return (error.code && messages[error.code]) || unknownErrorMessage;
}
