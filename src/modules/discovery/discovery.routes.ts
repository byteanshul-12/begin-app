import { Router } from "express";
import {
  renderDiscoveryPage,
  searchMembersApi,
  searchStartupsApi,
  globalSearchApi,
  getSuggestedMatchesApi,
  toggleFollowApi,
  toggleShortlistApi,
  getShortlistApi,
} from "./discovery.controller.ts";
import { requireAuth, requireOnboarded } from "../../middleware/auth.middleware.ts";
import { validate } from "../../middleware/validate.middleware.ts";
import {
  followPayloadSchema,
  shortlistPayloadSchema,
  searchMembersQuerySchema,
  searchStartupsQuerySchema,
  globalSearchQuerySchema,
} from "./discovery.validation.ts";

const router = Router();

// Page views
router.get("/", requireAuth, requireOnboarded, renderDiscoveryPage);

// REST API search endpoints
router.get("/members", requireAuth, validate({ query: searchMembersQuerySchema }), searchMembersApi);
router.get("/startups", requireAuth, validate({ query: searchStartupsQuerySchema }), searchStartupsApi);
router.get("/search", requireAuth, validate({ query: globalSearchQuerySchema }), globalSearchApi);
router.get("/suggested", requireAuth, getSuggestedMatchesApi);

// Social Follow & Private Shortlist endpoints
router.post("/follow", requireAuth, validate({ body: followPayloadSchema }), toggleFollowApi);
router.post("/shortlist", requireAuth, validate({ body: shortlistPayloadSchema }), toggleShortlistApi);
router.get("/shortlist", requireAuth, getShortlistApi);

// Aliases when mounted under /api/discovery
router.get("/api/members", requireAuth, validate({ query: searchMembersQuerySchema }), searchMembersApi);
router.get("/api/startups", requireAuth, validate({ query: searchStartupsQuerySchema }), searchStartupsApi);
router.get("/api/search", requireAuth, validate({ query: globalSearchQuerySchema }), globalSearchApi);
router.get("/api/suggested", requireAuth, getSuggestedMatchesApi);
router.post("/api/follow", requireAuth, validate({ body: followPayloadSchema }), toggleFollowApi);
router.post("/api/shortlist", requireAuth, validate({ body: shortlistPayloadSchema }), toggleShortlistApi);
router.get("/api/shortlist", requireAuth, getShortlistApi);

export default router;
