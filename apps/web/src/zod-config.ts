import { z } from 'zod';

// Zod speeds up parsing with new Function(), which the Content-Security-Policy refuses. It checks
// whether it may when a schema is defined, so this runs before any module that defines one:
// main.tsx imports this file first. Without it, the browser logs a CSP error on every load.
z.config({ jitless: true });
