import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SSL: z
    .string()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ACCESS_TOKEN_TTL: z.string().default('30m'),
  REFRESH_TOKEN_TTL: z.string().default('60d'),
  REGISTRATION_TOKEN_TTL: z.string().default('15m'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),

  AWS_REGION: z.string().min(1).default('us-east-1'),
  AWS_S3_BUCKET: z.string().min(1),
  /** Si se setea (ej. CDN/CloudFront), se usa como base de la URL publica. Si no, se construye `https://{bucket}.s3.{region}.amazonaws.com`. */
  AWS_S3_PUBLIC_BASE_URL: z.string().url().optional(),
  /** Carpeta donde LocalDocumentStorage guarda los documentos. En prod = punto de montaje del volumen de Coolify (ej. /app/uploads). Default: <cwd>/uploads. */
  UPLOADS_DIR: z.string().min(1).optional(),

  BREVO_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().default('noreply@codigoverse.space'),
  EMAIL_FROM_NAME: z.string().min(1).default('Jala'),
  BREVO_TEMPLATE_ID: z.coerce.number().int().positive().optional(),

  SOCKET_CORS_ORIGIN: z.string().default('*'),
  FCM_SERVICE_ACCOUNT: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno invalidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
