import { z } from 'zod';
import { currencyCodeSchema, localeSchema } from './settings.ts';

// There is no second factor yet, so length is the main protection. No rules about character types.
// The API, the forms and the reset command all use these numbers.
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters`);

const emailSchema = z.string().trim().pipe(z.email('Enter a valid email address'));

/** What the sign-up form sends. Better Auth checks it again on the server. */
export const signUpInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100, 'Use at most 100 characters'),
  email: emailSchema,
  password: passwordSchema,
});

/** What the sign-in form sends. */
export const signInInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/** Body of GET /api/me: the signed-in user. */
export const meResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  baseCurrency: currencyCodeSchema,
  locale: localeSchema,
});

/** Body of GET /api/auth-options. Drives the pages only; the API enforces the setting itself. */
export const authOptionsResponseSchema = z.object({
  signUpEnabled: z.boolean(),
});

/** Error body. Better Auth answers errors in this shape, so our routes do too. */
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type AuthOptionsResponse = z.infer<typeof authOptionsResponseSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
