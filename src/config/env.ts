import "dotenv/config";
import { z } from "zod";

/**
 * Zod schema validating critical environment variables with development defaults.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8000),
  MONGO_URI: z.string().default("mongodb://localhost:27017/begin_db"),
  JWT_SECRET: z.string().default("default_jwt_secret_dev_only"),
  RESEND_API_KEY: z.string().default("re_dummy_dev_key"),
  EMAIL_FROM: z.string().default("onboarding@resend.dev"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_CALLBACK_URL: z.string().default("http://localhost:8000/auth/google/callback"),
});

const parsedEnv = envSchema.parse(process.env);

/**
 * Interface describing database connection settings.
 */
export interface DatabaseConfig {
  mongoUri: string;
}

/**
 * Interface describing JWT authentication session settings.
 */
export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

/**
 * Interface describing transactional email service settings (Resend API).
 */
export interface EmailConfig {
  resendApiKey: string;
  from: string;
}

/**
 * Interface describing Google OAuth 2.0 credentials and redirection callback.
 */
export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

/**
 * Interface describing file upload size and handling boundaries.
 */
export interface UploadsConfig {
  maxFileSizeBytes: number;
}

/**
 * Root application configuration shape.
 */
export interface AppConfig {
  env: string;
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  email: EmailConfig;
  googleAuth: GoogleAuthConfig;
  uploads: UploadsConfig;
}

/**
 * Centralized environment configuration.
 * Exposes strongly typed and validated configuration properties.
 */
export const config: AppConfig = {
  env: parsedEnv.NODE_ENV,
  port: parsedEnv.PORT,

  database: {
    mongoUri: parsedEnv.MONGO_URI,
  },

  jwt: {
    secret: parsedEnv.JWT_SECRET,
    expiresIn: "7d",
  },

  email: {
    resendApiKey: parsedEnv.RESEND_API_KEY,
    from: parsedEnv.EMAIL_FROM,
  },

  googleAuth: {
    clientId: parsedEnv.GOOGLE_CLIENT_ID,
    clientSecret: parsedEnv.GOOGLE_CLIENT_SECRET,
    callbackUrl: parsedEnv.GOOGLE_CALLBACK_URL,
  },

  uploads: {
    maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
  },
};

export default config;
