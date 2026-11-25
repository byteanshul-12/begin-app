import startupRepository from "./startup.repository.ts";
import profileRepository from "../profiles/profile.repository.ts";
import Auth from "../auth/models/auth.model.ts";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../shared/errors/index.ts";
import type { IStartup, StartupStage, StartupVisibility } from "../../shared/types/database.types.ts";

/**
 * Service managing startup entity operations, stealth visibility enforcement,
 * team member invitations, milestone timelines, and ownership transfers.
 */

const VALID_STAGES = ["Idea", "Building MVP", "Launched", "Has users"];
const VALID_VISIBILITIES = ["PUBLIC", "STEALTH"];
const VALID_ROLE_TYPES = ["co-founder", "teammate", "short-term collaboration"];

function sanitizeTags(tags: any): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createStartup(ownerId: string | any, data: any): Promise<IStartup> {
  const { name, pitch, problem, solution, industryTags, stage, links, visibility } = data;

  if (!name || !name.trim()) {
    throw new BadRequestError("Startup name is required.");
  }

  const trimmedPitch = (pitch || "").trim();
  if (!trimmedPitch) {
    throw new BadRequestError("One-line pitch is required.");
  }
  if (trimmedPitch.length > 200) {
    throw new BadRequestError("Pitch cannot exceed 200 characters.");
  }

  const selectedStage = VALID_STAGES.includes(stage) ? (stage as StartupStage) : "Idea";
  const selectedVisibility = VALID_VISIBILITIES.includes(visibility) ? (visibility as StartupVisibility) : "PUBLIC";

  const startup = await startupRepository.create({
    name: name.trim(),
    pitch: trimmedPitch,
    problem: (problem || "").trim(),
    solution: (solution || "").trim(),
    industryTags: sanitizeTags(industryTags),
    stage: selectedStage,
    visibility: selectedVisibility,
    ownerId,
    teamMembers: [
      {
        userId: ownerId,
        role: "Founder",
        joinedDate: new Date(),
      },
    ],
    links: {
      website: (links?.website || "").trim(),
      demo: (links?.demo || "").trim(),
      github: (links?.github || "").trim(),
      pitchDeck: (links?.pitchDeck || "").trim(),
    },
  });

  const profileDoc = await profileRepository.findDocumentByUserId(ownerId);
  if (profileDoc) {
    if (!profileDoc.linkedStartups) profileDoc.linkedStartups = [];
    profileDoc.linkedStartups.push({
      startupId: startup._id,
      name: startup.name,
      stage: startup.stage,
      role: "Founder",
    });
    await profileRepository.save(profileDoc);
  }

  return startup;
}

export async function getStartupById(startupId: string | any, requesterUserId: string | any = null): Promise<any> {
  const startup = await startupRepository.findById(startupId, {
    populate: [
      { path: "ownerId", select: "email" },
      { path: "teamMembers.userId", select: "email" },
    ],
  });

  if (!startup || startup.isArchived) {
    return null;
  }

  const ownerIdString = ((startup.ownerId as any)?._id || startup.ownerId)?.toString();
  const requesterIdString = requesterUserId?.toString();

  const isOwner = Boolean(requesterIdString && ownerIdString === requesterIdString);
  const isMember = Boolean(
    isOwner ||
      (requesterIdString &&
        startup.teamMembers?.some(
          (m: any) => ((m.userId as any)?._id || m.userId)?.toString() === requesterIdString
        ))
  );

  const startupObject: any = (startup as any).toObject ? (startup as any).toObject() : { ...startup };

  if (startupObject.visibility === "STEALTH" && !isOwner && !isMember) {
    delete startupObject.problem;
    delete startupObject.solution;
    if (startupObject.links) {
      delete startupObject.links.pitchDeck;
      delete startupObject.links.demo;
    }
    startupObject.isStealthMasked = true;
  }

  startupObject.isOwner = isOwner;
  startupObject.isMember = isMember;

  return startupObject;
}

export async function listStartups(queryParams: any = {}, requesterUserId: string | any = null): Promise<any[]> {
  const { stage, industry, search } = queryParams;
  const filter: any = { isArchived: false };

  if (stage && VALID_STAGES.includes(stage)) {
    filter.stage = stage;
  }

  if (industry && industry.trim()) {
    filter.industryTags = { $regex: new RegExp(`^${industry.trim()}$`, "i") };
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ name: regex }, { pitch: regex }, { industryTags: regex }];
  }

  const startups = await startupRepository.findMany(filter, {
    populate: [{ path: "ownerId", select: "email" }],
    sort: { createdAt: -1 },
  });

  const requesterIdString = requesterUserId?.toString();

  return startups.map((s: any) => {
    const ownerIdString = (s.ownerId?._id || s.ownerId)?.toString();
    const isOwner = Boolean(requesterIdString && ownerIdString === requesterIdString);
    const isMember = Boolean(
      isOwner ||
        (requesterIdString &&
          s.teamMembers?.some(
            (m: any) => (m.userId?._id || m.userId)?.toString() === requesterIdString
          ))
    );

    const sObj = s.toObject ? s.toObject() : { ...s };

    if (sObj.visibility === "STEALTH" && !isOwner && !isMember) {
      delete sObj.problem;
      delete sObj.solution;
      if (sObj.links) {
        delete sObj.links.pitchDeck;
        delete sObj.links.demo;
      }
      sObj.isStealthMasked = true;
    }

    sObj.isOwner = isOwner;
    sObj.isMember = isMember;
    return sObj;
  });
}

export async function updateStartup(startupId: string | any, userId: string | any, updateData: any): Promise<IStartup> {
  const startup = await startupRepository.findDocumentById(startupId);
  if (!startup || startup.isArchived) {
    throw new NotFoundError("Startup not found.");
  }

  if (startup.ownerId.toString() !== userId.toString()) {
    throw new ForbiddenError("Only the venture owner can modify startup information.");
  }

  const editableFields = ["name", "pitch", "problem", "solution", "visibility"];
  editableFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      startup[field] = typeof updateData[field] === "string" ? updateData[field].trim() : updateData[field];
    }
  });

  if (updateData.stage && VALID_STAGES.includes(updateData.stage)) {
    startup.stage = updateData.stage;
  }

  if (updateData.industryTags !== undefined) {
    startup.industryTags = sanitizeTags(updateData.industryTags);
  }

  if (updateData.links) {
    startup.links = {
      website: (updateData.links.website || startup.links?.website || "").trim(),
      demo: (updateData.links.demo || startup.links?.demo || "").trim(),
      github: (updateData.links.github || startup.links?.github || "").trim(),
      pitchDeck: (updateData.links.pitchDeck || startup.links?.pitchDeck || "").trim(),
    };
  }

  const saved = await startupRepository.save(startup);

  await profileRepository.updateByUserId(userId, {
    "linkedStartups.$[elem].name": saved.name,
    "linkedStartups.$[elem].stage": saved.stage,
  });

  return saved;
}

export async function inviteTeamMember(
  startupId: string | any,
  ownerId: string | any,
  { email, role }: { email: string; role?: string }
): Promise<IStartup> {
  if (!email || !email.trim()) {
    throw new BadRequestError("Recipient email address is required.");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const startup = await startupRepository.findDocumentById(startupId);

  if (!startup || startup.isArchived) {
    throw new NotFoundError("Startup not found.");
  }

  if (startup.ownerId.toString() !== ownerId.toString()) {
    throw new ForbiddenError("Only the startup founder can invite team members.");
  }

  const existingInvite = startup.invitations.find(
    (inv: any) => inv.email.toLowerCase() === normalizedEmail && inv.status === "PENDING"
  );
  if (existingInvite) {
    throw new BadRequestError("An invitation is already pending for this email address.");
  }

  const registeredUser = await Auth.findOne({ email: normalizedEmail }).lean();

  if (registeredUser) {
    const isAlreadyMember = startup.teamMembers.some(
      (m: any) => m.userId.toString() === registeredUser._id.toString()
    );
    if (isAlreadyMember) {
      throw new BadRequestError("This user is already a member of the venture.");
    }

    startup.teamMembers.push({
      userId: registeredUser._id,
      role: (role || "Team Member").trim(),
      joinedDate: new Date(),
    });

    const userProfile = await profileRepository.findDocumentByUserId(registeredUser._id);
    if (userProfile) {
      if (!userProfile.linkedStartups) userProfile.linkedStartups = [];
      userProfile.linkedStartups.push({
        startupId: startup._id,
        name: startup.name,
        stage: startup.stage,
        role: (role || "Team Member").trim(),
      });
      await profileRepository.save(userProfile);
    }
  }

  startup.invitations.push({
    email: normalizedEmail,
    role: (role || "Team Member").trim(),
    status: registeredUser ? "ACCEPTED" : "PENDING",
    invitedAt: new Date(),
  });

  return startupRepository.save(startup);
}

export async function removeTeamMember(
  startupId: string | any,
  ownerId: string | any,
  memberUserId: string | any
): Promise<IStartup> {
  const startup = await startupRepository.findDocumentById(startupId);
  if (!startup || startup.isArchived) {
    throw new NotFoundError("Startup not found.");
  }

  if (startup.ownerId.toString() !== ownerId.toString()) {
    throw new ForbiddenError("Only the startup owner can remove team members.");
  }

  if (memberUserId.toString() === startup.ownerId.toString()) {
    throw new BadRequestError("The founder cannot be removed as a team member.");
  }

  startup.teamMembers = startup.teamMembers.filter(
    (m: any) => m.userId.toString() !== memberUserId.toString()
  );

  const profileDoc = await profileRepository.findDocumentByUserId(memberUserId);
  if (profileDoc && profileDoc.linkedStartups) {
    profileDoc.linkedStartups = profileDoc.linkedStartups.filter(
      (ls: any) => ls.startupId?.toString() !== startupId.toString()
    );
    await profileRepository.save(profileDoc);
  }

  return startupRepository.save(startup);
}

export async function addOpenRole(startupId: string | any, ownerId: string | any, roleData: any): Promise<IStartup> {
  const { title, skillsNeeded, commitmentHours, roleType, equityOrCreditNote } = roleData;

  if (!title || !title.trim()) {
    throw new BadRequestError("Role title is required.");
  }

  const startup = await startupRepository.findDocumentById(startupId);
  if (!startup || startup.isArchived) {
    throw new NotFoundError("Startup not found.");
  }

  if (startup.ownerId.toString() !== ownerId.toString()) {
    throw new ForbiddenError("Only the startup founder can post open roles.");
  }

  const selectedRoleType = VALID_ROLE_TYPES.includes(roleType) ? roleType : "teammate";

  startup.openRoles.push({
    title: title.trim(),
    skillsNeeded: sanitizeTags(skillsNeeded),
    commitmentHours: Math.max(0, parseInt(commitmentHours, 10) || 0),
    roleType: selectedRoleType,
    equityOrCreditNote: (equityOrCreditNote || "").trim(),
    status: "OPEN",
    createdAt: new Date(),
  });

  return startupRepository.save(startup);
}

export async function deleteOpenRole(startupId: string | any, ownerId: string | any, roleId: string | any): Promise<IStartup> {
  const startup = await startupRepository.findDocumentById(startupId);
  if (!startup || startup.isArchived) {
    throw new NotFoundError("Startup not found.");
  }

  if (startup.ownerId.toString() !== ownerId.toString()) {
    throw new ForbiddenError("Only the founder can manage open roles.");
  }

  startup.openRoles = startup.openRoles.filter(
    (r: any) => r._id.toString() !== roleId.toString()
  );

  return startupRepository.save(startup);
}

export async function addMilestone(startupId: string | any, ownerId: string | any, milestoneData: any): Promise<IStartup> {
  const { title, milestoneType, description, completedDate } = milestoneData;

  if (!title || !title.trim()) {
    throw new BadRequestError("Milestone title is required.");
  }

  const startup = await startupRepository.findDocumentById(startupId);
  if (!startup || startup.isArchived) {
    throw new NotFoundError("Startup not found.");
  }

  if (startup.ownerId.toString() !== ownerId.toString()) {
    throw new ForbiddenError("Only the startup founder can record venture milestones.");
  }

  startup.milestones.push({
    title: title.trim(),
    milestoneType: milestoneType || "Custom update",
    description: (description || "").trim(),
    completedDate: completedDate ? new Date(completedDate) : new Date(),
  });

  return startupRepository.save(startup);
}

export async function transferOwnership(
  startupId: string | any,
  currentOwnerId: string | any,
  newOwnerIdentifier: string
): Promise<IStartup> {
  if (!newOwnerIdentifier || !newOwnerIdentifier.trim()) {
    throw new BadRequestError("New owner email or ID is required.");
  }

  const startup = await startupRepository.findDocumentById(startupId);
  if (!startup || startup.isArchived) {
    throw new NotFoundError("Startup not found.");
  }

  if (startup.ownerId.toString() !== currentOwnerId.toString()) {
    throw new ForbiddenError("Only the current founder can transfer venture ownership.");
  }

  const query = newOwnerIdentifier.includes("@")
    ? { email: newOwnerIdentifier.toLowerCase().trim() }
    : { _id: newOwnerIdentifier };

  const targetAuth = await Auth.findOne(query).lean();
  if (!targetAuth) {
    throw new NotFoundError("The specified user does not have an active account.");
  }

  startup.ownerId = targetAuth._id;

  const isMember = startup.teamMembers.some(
    (m: any) => m.userId.toString() === targetAuth._id.toString()
  );
  if (!isMember) {
    startup.teamMembers.push({
      userId: targetAuth._id,
      role: "Founder",
      joinedDate: new Date(),
    });
  }

  return startupRepository.save(startup);
}

export async function archiveStartup(startupId: string | any, ownerId: string | any): Promise<IStartup> {
  const startup = await startupRepository.findDocumentById(startupId);
  if (!startup) {
    throw new NotFoundError("Startup not found.");
  }

  if (startup.ownerId.toString() !== ownerId.toString()) {
    throw new ForbiddenError("Only the startup owner can archive this venture.");
  }

  startup.isArchived = true;
  startup.archivedAt = new Date();

  return startupRepository.save(startup);
}
