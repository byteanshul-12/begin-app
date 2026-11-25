import { z } from "zod";
import { objectIdSchema } from "../../shared/validation/common.schemas.ts";
import type { StartupStage, StartupVisibility, OpenRoleType } from "../../shared/types/database.types.ts";

/**
 * Zod validation schemas and types for startups, team members, open roles, and milestones.
 */

export const startupIdParamSchema = z.object({
  id: objectIdSchema,
});

export const removeMemberParamSchema = z.object({
  id: objectIdSchema,
  memberUserId: objectIdSchema,
});

export const roleParamSchema = z.object({
  id: objectIdSchema,
  roleId: objectIdSchema,
});

export const startupPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Startup name is required.")
    .max(100, "Startup name cannot exceed 100 characters."),
  pitch: z
    .string()
    .trim()
    .min(1, "One-line pitch is required.")
    .max(200, "One-line pitch must not exceed 200 characters."),
  stage: z.enum(["Idea", "Building MVP", "Launched", "Has users"]).default("Idea"),
  visibility: z.enum(["PUBLIC", "STEALTH"]).default("PUBLIC"),
  problem: z.string().trim().max(2000).optional().default(""),
  solution: z.string().trim().max(2000).optional().default(""),
  industryTags: z.union([z.array(z.string()), z.string()]).optional(),
  links: z.record(z.string(), z.string()).optional(),
});

export const updateStartupPayloadSchema = startupPayloadSchema.partial();

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address."),
  role: z
    .string()
    .trim()
    .min(1, "Role is required.")
    .max(50, "Role cannot exceed 50 characters."),
});

export const openRolePayloadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Role title is required.")
    .max(100, "Role title cannot exceed 100 characters."),
  skillsNeeded: z.union([z.array(z.string()), z.string()]).optional(),
  commitmentHours: z.coerce.number().min(0).max(100).default(0),
  roleType: z.enum(["co-founder", "founding-team", "teammate", "intern", "advisor"]).default("teammate"),
  equityOrCreditNote: z.string().trim().max(100).optional().default(""),
});

export const milestonePayloadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Milestone title is required.")
    .max(100, "Milestone title cannot exceed 100 characters."),
  milestoneType: z.string().trim().max(50).default("Custom update"),
  description: z.string().trim().max(500).optional().default(""),
});

export const transferOwnershipSchema = z
  .object({
    newOwnerEmail: z.string().trim().toLowerCase().email().optional(),
    newOwnerId: objectIdSchema.optional(),
  })
  .refine((data) => Boolean(data.newOwnerEmail || data.newOwnerId), {
    message: "Either newOwnerEmail or newOwnerId must be provided.",
  });

export type StartupPayload = z.infer<typeof startupPayloadSchema>;
export type UpdateStartupPayload = z.infer<typeof updateStartupPayloadSchema>;
export type InviteMemberPayload = z.infer<typeof inviteMemberSchema>;
export type OpenRolePayload = z.infer<typeof openRolePayloadSchema>;
export type MilestonePayload = z.infer<typeof milestonePayloadSchema>;
export type TransferOwnershipPayload = z.infer<typeof transferOwnershipSchema>;

/**
 * Validates startup creation payload.
 */
export function validateStartupPayload(body: any): StartupPayload {
  return startupPayloadSchema.parse(body || {});
}

/**
 * Validates open role creation payload.
 */
export function validateOpenRolePayload(body: any): OpenRolePayload {
  return openRolePayloadSchema.parse(body || {});
}

/**
 * Validates milestone creation payload.
 */
export function validateMilestonePayload(body: any): MilestonePayload {
  return milestonePayloadSchema.parse(body || {});
}
