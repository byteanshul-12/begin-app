import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";

/**
 * Shape defining optional Zod schemas for request body, query parameters, and route params.
 */
export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Formats Zod validation issues into clean field-level error details.
 */
export function formatZodIssues(issues: any[]) {
  return issues.map((issue) => ({
    field: issue.path.join(".") || "value",
    message: issue.message,
  }));
}

/**
 * Express middleware factory that validates incoming request body, query parameters,
 * and route parameters against provided Zod schemas.
 *
 * Adheres to Section 6.2 & 7.1 of Begin backend architecture:
 * Rejects invalid requests before they reach business logic or database operations.
 */
export function validate(schemas: RequestValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params);
        try {
          req.params = parsedParams;
        } catch {
          Object.defineProperty(req, "params", {
            value: parsedParams,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        }
      }

      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        Object.defineProperty(req, "query", {
          value: parsedQuery,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = formatZodIssues(error.issues);
        const firstMessage = error.issues[0]?.message || "Invalid request data.";

        return res.status(400).json({
          success: false,
          message: firstMessage,
          error: {
            code: "VALIDATION_ERROR",
            message: firstMessage,
            details,
          },
        });
      }

      return next(error);
    }
  };
}

export default validate;
