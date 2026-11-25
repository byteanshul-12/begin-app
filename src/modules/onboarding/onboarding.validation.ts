import { z } from "zod";
import type { ProfileRole } from "../../shared/types/database.types.ts";

/**
 * Zod validation schemas and types for onboarding steps.
 */

export const roleSelectionSchema = z.object({
  role: z.enum(["FOUNDER", "JOINER", "BOTH"]),
});

export const profileSetupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full Name is required.")
    .max(80, "Full Name cannot exceed 80 characters."),
  college: z
    .string()
    .trim()
    .min(1, "College is required.")
    .max(120, "College name cannot exceed 120 characters."),
  bio: z
    .string()
    .trim()
    .max(280, "Bio cannot exceed 280 characters.")
    .optional()
    .default(""),
  startupName: z.string().trim().optional().default(""),
  stage: z.string().trim().optional().default(""),
  skills: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .default([]),
  year: z.string().trim().optional().default(""),
  branch: z.string().trim().optional().default(""),
  interests: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .default([]),
  lookingFor: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .default([]),
});

export type ProfileSetupPayload = z.infer<typeof profileSetupSchema>;

/**
 * Validates role selection input.
 */
export function validateRoleSelection(role: any): ProfileRole {
  const result = roleSelectionSchema.parse({ role });
  return result.role as ProfileRole;
}

/**
 * Validates profile onboarding setup payload.
 */
export function validateProfileSetupPayload(body: any): ProfileSetupPayload {
  return profileSetupSchema.parse(body || {});
}
