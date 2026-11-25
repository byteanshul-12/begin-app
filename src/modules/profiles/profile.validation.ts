import { z } from "zod";
import { objectIdSchema } from "../../shared/validation/common.schemas.ts";
import type { PastWorkLinkType } from "../../shared/types/database.types.ts";

/**
 * Zod validation schemas and types for profile updates, past work, and privacy settings.
 */

export const profileIdParamSchema = z.object({
  id: objectIdSchema,
});

export const workIdParamSchema = z.object({
  workId: objectIdSchema,
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().max(80).optional(),
  college: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(280).optional(),
  year: z.string().trim().max(30).optional(),
  branch: z.string().trim().max(80).optional(),
  role: z.enum(["FOUNDER", "JOINER", "BOTH"]).optional(),
  skills: z.union([z.array(z.string()), z.string()]).optional(),
  interests: z.union([z.array(z.string()), z.string()]).optional(),
  lookingFor: z.union([z.array(z.string()), z.string()]).optional(),
  availabilityStatus: z.enum(["Available", "Looking for co-founder", "Busy", "Not available"]).optional(),
  weeklyHoursAvailable: z.coerce.number().min(0).max(168).optional(),
  isOnboarded: z.coerce.boolean().optional(),
  socialLinks: z
    .object({
      linkedin: z.string().trim().optional().or(z.literal("")),
      github: z.string().trim().optional().or(z.literal("")),
      twitter: z.string().trim().optional().or(z.literal("")),
      portfolio: z.string().trim().optional().or(z.literal("")),
    })
    .optional(),
  privacy: z
    .object({
      hideYear: z.coerce.boolean().optional(),
      hideBranch: z.coerce.boolean().optional(),
      allowIntroRequests: z.coerce.boolean().optional(),
    })
    .optional(),
});

export const pastWorkSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Project title is required.")
    .max(100, "Project title cannot exceed 100 characters."),
  url: z
    .string()
    .trim()
    .min(1, "Project URL is required.")
    .url("Please provide a valid project URL."),
  linkType: z
    .enum(["GitHub", "Behance", "Portfolio", "Figma", "Live Demo", "Other"])
    .default("Portfolio"),
  description: z
    .string()
    .trim()
    .max(280, "Description cannot exceed 280 characters.")
    .optional()
    .default(""),
});

export const privacySchema = z.object({
  hideYear: z.coerce.boolean().optional(),
  hideBranch: z.coerce.boolean().optional(),
  allowIntroRequests: z.coerce.boolean().optional(),
});

export type PastWorkInput = z.infer<typeof pastWorkSchema>;
export type PrivacyInput = z.infer<typeof privacySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Validates past work item payload.
 */
export function validatePastWorkPayload(body: any): PastWorkInput {
  return pastWorkSchema.parse(body || {});
}

/**
 * Validates privacy settings update payload.
 */
export function validatePrivacyPayload(body: any): PrivacyInput {
  return privacySchema.parse(body || {});
}
