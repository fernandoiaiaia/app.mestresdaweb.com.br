import { config } from "dotenv";
import { resolve } from "path";

// Load .env file
config({ path: resolve(process.cwd(), ".env") });

import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
    PORT: z.coerce.number().default(3333),

    // Database
    DATABASE_URL: z.string().url(),

    // Redis
    REDIS_URL: z.string().default("redis://localhost:6379"),

    // JWT
    JWT_ACCESS_SECRET: z.string().min(10),
    JWT_REFRESH_SECRET: z.string().min(10),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    // CORS
    CORS_ORIGIN: z.string().default("http://localhost:1100"),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),

    // Sentry (optional)
    SENTRY_DSN: z.string().optional(),

    // ═══ SDR Automático ═══
    // Brevo
    BREVO_API_KEY: z.string().optional(),
    BREVO_FROM_EMAIL: z.string().optional(),
    BREVO_FROM_NAME: z.string().optional(),

    // WhatsApp (Meta Cloud API)
    WHATSAPP_ACCESS_TOKEN: z.string().optional(),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
    WHATSAPP_VERIFY_TOKEN: z.string().optional(),

    // Synthflow AI
    SYNTHFLOW_API_KEY: z.string().optional(),
    SYNTHFLOW_MODEL_ID: z.string().optional(),

    // Google Calendar
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.string().optional(),

    // Google OAuth (Auth Login)
    GOOGLE_AUTH_CLIENT_ID: z.string().optional(),

    // Frontend URL
    FRONTEND_URL: z.string().default("http://localhost:1100"),

    // Anthropic (Claude)
    ANTHROPIC_API_KEY: z.string().optional(),

    // SDR Config
    SDR_CRON_INTERVAL: z.string().default("*/5 * * * *"),
    SDR_BUSINESS_HOURS_START: z.string().default("08:00"),
    SDR_BUSINESS_HOURS_END: z.string().default("18:00"),
    SDR_TIMEZONE: z.string().default("America/Sao_Paulo"),
    SDR_MAX_CALLS_PER_DAY: z.coerce.number().default(50),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error("❌ Invalid environment variables:");
        console.error(parsed.error.flatten().fieldErrors);
        process.exit(1);
    }

    return parsed.data;
}

export const env = validateEnv();
