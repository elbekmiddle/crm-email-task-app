import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI majburiy'),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().default(6379),

  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY majburiy'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  WEBHOOK_SECRET: z.string().min(1, 'WEBHOOK_SECRET majburiy'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  return parsed.data;
}
