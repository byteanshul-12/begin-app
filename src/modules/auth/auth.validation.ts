import { z } from "zod";
import { sanitizeEmail } from "../../shared/utils/string.utils.ts";

/**
 * Zod validation schemas and types for authentication endpoints.
 */

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .transform((val) => sanitizeEmail(val))
    .pipe(z.string().email("Please provide a valid email address.")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters."),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .transform((val) => sanitizeEmail(val))
    .pipe(z.string().email("Please provide a valid email address.")),
  password: z
    .string()
    .min(1, "Password is required."),
});

export const googleCallbackQuerySchema = z
  .object({
    code: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validates signup payload and returns sanitized typed data.
 */
export function validateSignupPayload(body: any): SignupInput {
  return signupSchema.parse(body);
}

/**
 * Validates login payload and returns sanitized typed data.
 */
export function validateLoginPayload(body: any): LoginInput {
  return loginSchema.parse(body);
}
