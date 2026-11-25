import { Router } from "express";
import {
  renderStartupListPage,
  renderCreateStartupPage,
  renderStartupDetailPage,
  renderEditStartupPage,
  createStartupApi,
  getStartupApi,
  listStartupsApi,
  updateStartupApi,
  inviteMemberApi,
  removeMemberApi,
  addOpenRoleApi,
  deleteOpenRoleApi,
  addMilestoneApi,
  transferOwnershipApi,
  archiveStartupApi,
} from "./startup.controller.ts";
import { requireAuth, requireOnboarded } from "../../middleware/auth.middleware.ts";
import { validate } from "../../middleware/validate.middleware.ts";
import {
  startupIdParamSchema,
  removeMemberParamSchema,
  roleParamSchema,
  startupPayloadSchema,
  updateStartupPayloadSchema,
  inviteMemberSchema,
  openRolePayloadSchema,
  milestonePayloadSchema,
  transferOwnershipSchema,
} from "./startup.validation.ts";

const router = Router();

// Page views
router.get("/", requireAuth, requireOnboarded, renderStartupListPage);
router.get("/new", requireAuth, requireOnboarded, renderCreateStartupPage);
router.get("/:id", requireAuth, requireOnboarded, validate({ params: startupIdParamSchema }), renderStartupDetailPage);
router.get("/:id/edit", requireAuth, requireOnboarded, validate({ params: startupIdParamSchema }), renderEditStartupPage);

// REST API endpoints
router.post("/api", requireAuth, validate({ body: startupPayloadSchema }), createStartupApi);
router.get("/api", requireAuth, listStartupsApi);
router.get("/api/:id", requireAuth, validate({ params: startupIdParamSchema }), getStartupApi);
router.put("/api/:id", requireAuth, validate({ params: startupIdParamSchema, body: updateStartupPayloadSchema }), updateStartupApi);
router.post("/api/:id/invite", requireAuth, validate({ params: startupIdParamSchema, body: inviteMemberSchema }), inviteMemberApi);
router.delete("/api/:id/member/:memberUserId", requireAuth, validate({ params: removeMemberParamSchema }), removeMemberApi);
router.post("/api/:id/role", requireAuth, validate({ params: startupIdParamSchema, body: openRolePayloadSchema }), addOpenRoleApi);
router.delete("/api/:id/role/:roleId", requireAuth, validate({ params: roleParamSchema }), deleteOpenRoleApi);
router.post("/api/:id/milestone", requireAuth, validate({ params: startupIdParamSchema, body: milestonePayloadSchema }), addMilestoneApi);
router.post("/api/:id/transfer", requireAuth, validate({ params: startupIdParamSchema, body: transferOwnershipSchema }), transferOwnershipApi);
router.post("/api/:id/archive", requireAuth, validate({ params: startupIdParamSchema }), archiveStartupApi);

// Direct aliases for when mounted under /api/startup
router.post("/", requireAuth, validate({ body: startupPayloadSchema }), createStartupApi);
router.get("/", requireAuth, listStartupsApi);
router.get("/:id", requireAuth, validate({ params: startupIdParamSchema }), getStartupApi);
router.put("/:id", requireAuth, validate({ params: startupIdParamSchema, body: updateStartupPayloadSchema }), updateStartupApi);
router.post("/:id/invite", requireAuth, validate({ params: startupIdParamSchema, body: inviteMemberSchema }), inviteMemberApi);
router.delete("/:id/member/:memberUserId", requireAuth, validate({ params: removeMemberParamSchema }), removeMemberApi);
router.post("/:id/role", requireAuth, validate({ params: startupIdParamSchema, body: openRolePayloadSchema }), addOpenRoleApi);
router.delete("/:id/role/:roleId", requireAuth, validate({ params: roleParamSchema }), deleteOpenRoleApi);
router.post("/:id/milestone", requireAuth, validate({ params: startupIdParamSchema, body: milestonePayloadSchema }), addMilestoneApi);
router.post("/:id/transfer", requireAuth, validate({ params: startupIdParamSchema, body: transferOwnershipSchema }), transferOwnershipApi);
router.post("/:id/archive", requireAuth, validate({ params: startupIdParamSchema }), archiveStartupApi);

export default router;
