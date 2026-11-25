import type { Request, Response } from "express";
import * as startupService from "./startup.service.ts";
import {
  validateStartupPayload,
  validateOpenRolePayload,
  validateMilestonePayload,
} from "./startup.validation.ts";

/**
 * Controller handling startup page rendering, REST endpoints,
 * stealth privacy mode, team member management, and milestone updates.
 */

export async function renderStartupListPage(req: Request, res: Response) {
  try {
    const startups = await startupService.listStartups(req.query, req.user?.userId);
    return res.render("startup/list", {
      user: res.locals.user,
      startups,
    });
  } catch (error: any) {
    return res.status(500).render("error", {
      message: error.message || "Failed to load startups.",
    });
  }
}

export async function renderCreateStartupPage(req: Request, res: Response) {
  return res.render("startup/create", {
    user: res.locals.user,
  });
}

export async function renderStartupDetailPage(req: Request, res: Response) {
  try {
    const startup = await startupService.getStartupById(req.params.id, req.user?.userId);
    if (!startup) {
      return res.status(404).render("error", {
        message: "Startup page not found or has been archived.",
      });
    }

    return res.render("startup/view", {
      user: res.locals.user,
      startup,
      isOwner: startup.isOwner,
      isMember: startup.isMember,
    });
  } catch (error: any) {
    return res.status(500).render("error", {
      message: error.message || "Failed to load startup details.",
    });
  }
}

export async function renderEditStartupPage(req: Request, res: Response) {
  try {
    const startup = await startupService.getStartupById(req.params.id, req.user?.userId);
    if (!startup || !startup.isOwner) {
      return res.status(403).render("error", {
        message: "Unauthorized: only the startup owner can edit this page.",
      });
    }

    return res.render("startup/edit", {
      user: res.locals.user,
      startup,
    });
  } catch (error: any) {
    return res.status(500).render("error", {
      message: error.message || "Failed to load startup editor.",
    });
  }
}

export async function createStartupApi(req: Request, res: Response) {
  try {
    const payload = validateStartupPayload(req.body);
    const startup = await startupService.createStartup(req.user.userId, payload);
    return res.status(201).json({
      success: true,
      message: "Startup profile created successfully.",
      startup,
      startupId: startup._id,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function getStartupApi(req: Request, res: Response) {
  try {
    const startup = await startupService.getStartupById(req.params.id, req.user?.userId);
    if (!startup) {
      return res.status(404).json({ success: false, message: "Startup not found." });
    }
    return res.status(200).json({ success: true, startup });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function listStartupsApi(req: Request, res: Response) {
  try {
    const startups = await startupService.listStartups(req.query, req.user?.userId);
    return res.status(200).json({ success: true, startups });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateStartupApi(req: Request, res: Response) {
  try {
    const updated = await startupService.updateStartup(req.params.id, req.user.userId, req.body);
    return res.status(200).json({
      success: true,
      message: "Startup profile updated successfully.",
      startup: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return res.status(status).json({ success: false, message: error.message });
  }
}

export async function inviteMemberApi(req: Request, res: Response) {
  try {
    const { email, role } = req.body;
    const updated = await startupService.inviteTeamMember(req.params.id, req.user.userId, { email, role });
    return res.status(200).json({
      success: true,
      message: "Invitation sent / member added.",
      startup: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return res.status(status).json({ success: false, message: error.message });
  }
}

export async function removeMemberApi(req: Request, res: Response) {
  try {
    const { memberUserId } = req.params;
    const updated = await startupService.removeTeamMember(req.params.id, req.user.userId, memberUserId);
    return res.status(200).json({
      success: true,
      message: "Team member removed.",
      startup: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return res.status(status).json({ success: false, message: error.message });
  }
}

export async function addOpenRoleApi(req: Request, res: Response) {
  try {
    const roleData = validateOpenRolePayload(req.body);
    const updated = await startupService.addOpenRole(req.params.id, req.user.userId, roleData);
    return res.status(201).json({
      success: true,
      message: "Role posted successfully.",
      startup: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return res.status(status).json({ success: false, message: error.message });
  }
}

export async function deleteOpenRoleApi(req: Request, res: Response) {
  try {
    const { roleId } = req.params;
    const updated = await startupService.deleteOpenRole(req.params.id, req.user.userId, roleId);
    return res.status(200).json({
      success: true,
      message: "Role removed successfully.",
      startup: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return res.status(status).json({ success: false, message: error.message });
  }
}

export async function addMilestoneApi(req: Request, res: Response) {
  try {
    const milestoneData = validateMilestonePayload(req.body);
    const updated = await startupService.addMilestone(req.params.id, req.user.userId, milestoneData);
    return res.status(201).json({
      success: true,
      message: "Milestone added to timeline.",
      startup: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return res.status(status).json({ success: false, message: error.message });
  }
}

export async function transferOwnershipApi(req: Request, res: Response) {
  try {
    const target = req.body.newOwnerEmail || req.body.newOwnerId;
    const updated = await startupService.transferOwnership(req.params.id, req.user.userId, target);
    return res.status(200).json({
      success: true,
      message: "Venture ownership transferred successfully.",
      startup: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return res.status(status).json({ success: false, message: error.message });
  }
}

export async function archiveStartupApi(req: Request, res: Response) {
  try {
    await startupService.archiveStartup(req.params.id, req.user.userId);
    return res.status(200).json({
      success: true,
      message: "Startup archived successfully.",
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    return res.status(status).json({ success: false, message: error.message });
  }
}
