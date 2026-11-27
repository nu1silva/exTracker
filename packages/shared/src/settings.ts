import { z } from 'zod';

/** ISO 4217 currency code, such as EUR. */
export const currencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Use a three-letter ISO 4217 code, such as EUR')
  .refine((code) => Intl.supportedValuesOf('currency').includes(code), 'Unknown currency code');

/** BCP 47 locale, such as en-IE. */
export const localeSchema = z.string().refine((locale) => {
  try {
    return Intl.getCanonicalLocales(locale).length === 1;
  } catch {
    return false;
  }
}, 'Use a BCP 47 locale, such as en-IE');

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;
export type Locale = z.infer<typeof localeSchema>;
