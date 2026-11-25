import { Router } from "express";
import {
  handleSignup,
  handleLogin,
  handleGetUserSignIn,
  handleGetLogin,
  logout,
  handleGoogleLogin,
  handleGoogleCallback,
} from "./auth.controller.ts";
import { validate } from "../../middleware/validate.middleware.ts";
import {
  signupSchema,
  loginSchema,
  googleCallbackQuerySchema,
} from "./auth.validation.ts";

const router = Router();

// Page routes
router.get("/signup", handleGetUserSignIn);
router.get("/signin", handleGetLogin);
router.get("/login", handleGetLogin);
router.get("/logout", logout);

// Google OAuth routes
router.get("/google", handleGoogleLogin);
router.get("/google/callback", validate({ query: googleCallbackQuerySchema }), handleGoogleCallback);

// Email + Password API routes
router.post("/signup", validate({ body: signupSchema }), handleSignup);
router.post("/login", validate({ body: loginSchema }), handleLogin);
router.post("/logout", logout);

export default router;
