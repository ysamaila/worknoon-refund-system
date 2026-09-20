import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/refunds?schema=public'),
  AI_DRIVER: z.enum(['mock', 'deepseek', 'anthropic', 'openai']).default('mock'),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_API_URL: z.string().default('https://api.deepseek.com/chat/completions'),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function maskSecret(secret?: string): string {
  if (!secret) return '(none)';
  if (secret.length <= 8) return '********';
  return `${secret.slice(0, 6)}...${secret.slice(-4)}`;
}

export function validateEnv(rawEnv: Record<string, unknown> = process.env): EnvConfig {
  const result = EnvSchema.safeParse(rawEnv);
  if (!result.success) {
    const errorDetails = result.error.format();
    throw new Error(
      `[EnvSecurity] Environment configuration validation failed: ${JSON.stringify(errorDetails, null, 2)}`,
    );
  }
  return Object.freeze(result.data);
}
