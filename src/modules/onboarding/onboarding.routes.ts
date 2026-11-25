import { Router } from "express";
import {
  getRolePage,
  saveRole,
  getProfilePage,
  saveProfile,
} from "./onboarding.controller.ts";
import { requireAuth } from "../../middleware/auth.middleware.ts";
import { validate } from "../../middleware/validate.middleware.ts";
import { roleSelectionSchema, profileSetupSchema } from "./onboarding.validation.ts";

const router = Router();

// Page views (requires login token)
router.get("/role", requireAuth, getRolePage);
router.get("/profile", requireAuth, getProfilePage);

// API actions
router.post("/role", requireAuth, validate({ body: roleSelectionSchema }), saveRole);
router.post("/profile", requireAuth, validate({ body: profileSetupSchema }), saveProfile);

export default router;
