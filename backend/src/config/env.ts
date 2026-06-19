import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  // Refresh token: secreto independiente y vida más larga. Si no se define,
  // se deriva del JWT_SECRET (ver middleware/auth.ts).
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  LM_STUDIO_URL: z.string().default('http://localhost:1234/v1'),
  // Opcional: id del modelo de visión a usar en LM Studio. Si se deja vacío,
  // no se envía el campo `model` y LM Studio usa el modelo actualmente cargado.
  LM_STUDIO_MODEL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
