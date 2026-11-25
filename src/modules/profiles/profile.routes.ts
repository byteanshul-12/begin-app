import { Router } from "express";
import {
  renderMyProfilePage,
  renderEditProfilePage,
  renderPublicProfilePage,
  getMyProfileApi,
  updateProfileApi,
  uploadAvatarApi,
  addPastWorkApi,
  deletePastWorkApi,
  updatePrivacyApi,
  getPublicProfileApi,
} from "./profile.controller.ts";
import { requireAuth, requireOnboarded } from "../../middleware/auth.middleware.ts";
import { avatarUpload } from "../../infrastructure/storage/multer.storage.ts";
import { validate } from "../../middleware/validate.middleware.ts";
import {
  profileIdParamSchema,
  workIdParamSchema,
  updateProfileSchema,
  pastWorkSchema,
  privacySchema,
} from "./profile.validation.ts";

const router = Router();

// Page routes
router.get("/", requireAuth, requireOnboarded, renderMyProfilePage);
router.get("/me", requireAuth, requireOnboarded, renderMyProfilePage);
router.get("/edit", requireAuth, requireOnboarded, renderEditProfilePage);
router.get("/:id", requireAuth, requireOnboarded, validate({ params: profileIdParamSchema }), renderPublicProfilePage);

// API routes for profile management
router.get("/api/me", requireAuth, getMyProfileApi);
router.put("/api/me", requireAuth, validate({ body: updateProfileSchema }), updateProfileApi);
router.post("/api/avatar", requireAuth, avatarUpload.single("avatar"), uploadAvatarApi);
router.post("/api/past-work", requireAuth, validate({ body: pastWorkSchema }), addPastWorkApi);
router.delete("/api/past-work/:workId", requireAuth, validate({ params: workIdParamSchema }), deletePastWorkApi);
router.put("/api/privacy", requireAuth, validate({ body: privacySchema }), updatePrivacyApi);
router.get("/api/:id", requireAuth, validate({ params: profileIdParamSchema }), getPublicProfileApi);

// Direct aliases for when mounted under /api/profile
router.get("/me", requireAuth, getMyProfileApi);
router.put("/me", requireAuth, validate({ body: updateProfileSchema }), updateProfileApi);
router.post("/avatar", requireAuth, avatarUpload.single("avatar"), uploadAvatarApi);
router.post("/past-work", requireAuth, validate({ body: pastWorkSchema }), addPastWorkApi);
router.delete("/past-work/:workId", requireAuth, validate({ params: workIdParamSchema }), deletePastWorkApi);
router.put("/privacy", requireAuth, validate({ body: privacySchema }), updatePrivacyApi);

export default router;
