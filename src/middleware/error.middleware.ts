import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import config from "../config/env.ts";

/**
 * Global application error handler adhering to Sections 6.2 & 7.2.
 * Distinguishes between validation errors, operational errors, and unexpected exceptions.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError || err.name === "ZodError") {
    const details = err.issues.map((i: any) => ({
      field: i.path.join(".") || "value",
      message: i.message,
    }));
    const message = err.issues[0]?.message || "Validation failed";

    return res.status(400).json({
      success: false,
      message,
      error: {
        code: "VALIDATION_ERROR",
        message,
        details,
      },
    });
  }

  // 2. Operational / Application Errors
  const statusCode = err.statusCode || (err.name === "CastError" ? 400 : 500);
  const errorCode = err.code || (statusCode === 404 ? "NOT_FOUND" : statusCode === 401 ? "UNAUTHORIZED" : statusCode === 403 ? "FORBIDDEN" : "INTERNAL_ERROR");
  const message = err.message || "An unexpected error occurred.";

  if (config.env === "development") {
    console.error(`[ERROR ${statusCode}] ${req.method} ${req.url}:`, err);
  }

  // If request expects JSON or is an API route, send standardized JSON payload
  if (req.xhr || req.headers.accept?.includes("application/json") || req.path?.startsWith("/api/")) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: {
        code: errorCode,
        message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Otherwise render user-friendly error view
  return res.status(statusCode).render("error", {
    message,
  });
};
