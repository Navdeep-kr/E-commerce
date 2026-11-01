import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().default('https://example.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default('mock-anon-key'),
});

const _env = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!_env.success) {
  console.error('❌ Invalid environment configuration:', _env.error.format());
  throw new Error('Environment variable validation failed at boot');
}

export const env = _env.data;
