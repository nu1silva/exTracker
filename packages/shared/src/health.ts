import { z } from 'zod';

/** Body of GET /api/health. The API sends it with status 200 when healthy and 503 when not. */
export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  database: z.enum(['up', 'down']),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
