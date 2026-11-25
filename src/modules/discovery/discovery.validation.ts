import { z } from "zod";
import { objectIdSchema, paginationQuerySchema } from "../../shared/validation/common.schemas.ts";
import type { FollowTargetType, ShortlistItemType } from "../../shared/types/database.types.ts";

/**
 * Zod validation schemas and types for campus discovery filters, social follows, and shortlisting.
 */

export const followPayloadSchema = z.object({
  targetType: z.enum(["USER", "STARTUP"]),
  targetId: objectIdSchema,
});

export const shortlistPayloadSchema = z.object({
  itemType: z.enum(["USER", "STARTUP"]),
  itemId: objectIdSchema,
  note: z.string().trim().max(300, "Note cannot exceed 300 characters.").optional().default(""),
});

export const searchMembersQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  role: z.string().trim().optional(),
  college: z.string().trim().optional(),
  skill: z.string().trim().optional(),
  year: z.string().trim().optional(),
  branch: z.string().trim().optional(),
  availability: z.string().trim().optional(),
  lookingFor: z.string().trim().optional(),
});

export const searchStartupsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  stage: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  category: z.string().trim().optional(),
  hasOpenRoles: z.string().trim().optional(),
});

export const globalSearchQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
});

export type FollowPayload = z.infer<typeof followPayloadSchema>;
export type ShortlistPayload = z.infer<typeof shortlistPayloadSchema>;

/**
 * Validates social follow action payload.
 */
export function validateFollowPayload(body: any): FollowPayload {
  return followPayloadSchema.parse(body || {});
}

/**
 * Validates shortlist bookmark payload.
 */
export function validateShortlistPayload(body: any): ShortlistPayload {
  return shortlistPayloadSchema.parse(body || {});
}
