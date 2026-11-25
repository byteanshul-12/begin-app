import { z } from "zod";

/**
 * Common reusable Zod validation primitives across Begin modules.
 */

export const objectIdSchema = z
  .string()
  .min(1, "ID is required")
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid identifier format");

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please provide a valid email address");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
