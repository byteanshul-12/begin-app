import assert from "node:assert";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/infrastructure/database/connection.ts";
import { Auth, authService } from "../src/modules/auth/index.ts";
import { Profile, profileService } from "../src/modules/profiles/index.ts";
import { Startup, startupService } from "../src/modules/startups/index.ts";
import { discoveryService } from "../src/modules/discovery/index.ts";
import { calculateProfileCompletion } from "../src/shared/helpers/profileCompletion.helper.ts";

/**
 * End-to-end integration test validating domain logic, database operations,
 * privacy masking, and discovery features across all refactored modules.
 */

async function runIntegrationTests(): Promise<void> {
  console.log("Running Backend Integration Tests...");

  // 1. Database Connection
  await connectDB();
  assert.strictEqual(mongoose.connection.readyState, 1, "Database should be connected");
  console.log("PASS: Database connected successfully.");

  const testEmail = `test.user.${Date.now()}@college.edu`;

  // 2. Auth & Password Registration & Login
  console.log("Testing Auth Module...");
  const authSession: any = await authService.register(testEmail, "SecurePass123!");
  assert.ok(authSession.token, "JWT token should be generated");
  assert.strictEqual(authSession.isOnboarded, false, "New user should not be onboarded");
  const testUserId = authSession.user._id;

  const loginSession: any = await authService.login(testEmail, "SecurePass123!");
  assert.ok(loginSession.token, "Login token should be returned");
  assert.strictEqual(loginSession.user._id.toString(), testUserId.toString());

  // 3. Profile Setup & Completion
  console.log("Testing Profiles Module...");
  const initialProfile = await profileService.getProfileByUserId(testUserId);
  assert.ok(initialProfile, "Profile document should be auto-created");

  const updatedProfile: any = await profileService.updateProfile(testUserId, {
    fullName: "Integration Test User",
    college: "Test Engineering College",
    year: "3rd Year",
    branch: "Computer Science",
    bio: "Test bio for integration verification",
    isOnboarded: true,
    skills: ["React", "Node.js", "MongoDB"],
    interests: ["FinTech", "AI"],
    lookingFor: ["Designer"],
    availabilityStatus: "Looking for co-founder",
    weeklyHoursAvailable: 20,
    privacy: { hideYear: true, hideBranch: false, allowIntroRequests: true },
  });

  const completion = calculateProfileCompletion(updatedProfile);
  assert.ok(completion.completionPercentage >= 70, "Completion percentage should reflect provided fields");

  // Add past work
  const withWork: any = await profileService.addPastWork(testUserId, {
    title: "Test Portfolio Project",
    url: "https://github.com/example/test-project",
    linkType: "GitHub",
    description: "Sample description",
  });
  assert.strictEqual(withWork.pastWork.length, 1, "Past work entry should be recorded");

  // Verify privacy masking for other users
  const publicView: any = await profileService.getPublicProfileById(
    withWork._id.toString(),
    new mongoose.Types.ObjectId() // different requester
  );
  assert.strictEqual(publicView.year, undefined, "Year should be masked by privacy setting");
  assert.strictEqual(publicView.branch, "Computer Science", "Branch should be visible when hideBranch is false");

  // 4. Startups Module
  console.log("Testing Startups Module...");
  const newStartup: any = await startupService.createStartup(testUserId, {
    name: "Integration Venture",
    pitch: "A revolutionary platform for integration testing.",
    problem: "Validating refactored architectures manually is slow.",
    solution: "Automated test suites running across modular boundaries.",
    stage: "Building MVP",
    visibility: "STEALTH",
    industryTags: ["DevTools", "AI"],
  });
  assert.strictEqual(newStartup.name, "Integration Venture");

  // Add open role
  const withRole: any = await startupService.addOpenRole(newStartup._id, testUserId, {
    title: "Full Stack Engineer",
    skillsNeeded: ["React", "Node.js"],
    commitmentHours: 15,
    roleType: "co-founder",
  });
  assert.strictEqual(withRole.openRoles.length, 1, "Open role should be added");

  // Verify stealth masking for third-party viewer
  const nonMemberView: any = await startupService.getStartupById(
    newStartup._id,
    new mongoose.Types.ObjectId() // different requester
  );
  assert.strictEqual(nonMemberView.name, "Integration Venture", "Startup name should be preserved");
  assert.strictEqual(nonMemberView.problem, undefined, "Problem should be omitted in stealth mode");
  assert.strictEqual(nonMemberView.solution, undefined, "Solution should be omitted in stealth mode");
  assert.strictEqual(nonMemberView.openRoles.length, 1, "Open roles must remain discoverable");

  // 5. Discovery & Search Module
  console.log("Testing Discovery Module...");
  const memberSearch = await discoveryService.searchMembers("Integration");
  assert.ok(memberSearch.length >= 1, "Should discover member by name");

  const startupSearch = await discoveryService.searchStartups("revolutionary");
  assert.ok(startupSearch.length >= 1, "Should discover startup by pitch keyword");

  const unifiedSearch = await discoveryService.globalSearch("Integration");
  assert.ok(unifiedSearch.members.length >= 1, "Global search should return matching members");

  // Suggested matches
  const suggested: any = await discoveryService.getSuggestedMatches(testUserId);
  assert.ok(Array.isArray(suggested.recommendedMembers), "Should return recommended members array");
  assert.ok(Array.isArray(suggested.recommendedStartups), "Should return recommended startups array");

  // Follow & Shortlist
  const otherTargetId = new mongoose.Types.ObjectId();
  const followRes1 = await discoveryService.toggleFollow(testUserId, "USER", otherTargetId);
  assert.strictEqual(followRes1.isFollowing, true, "First toggle should follow");
  const followRes2 = await discoveryService.toggleFollow(testUserId, "USER", otherTargetId);
  assert.strictEqual(followRes2.isFollowing, false, "Second toggle should unfollow");

  const shortlistRes = await discoveryService.toggleShortlist(testUserId, "STARTUP", newStartup._id, "Test bookmark");
  assert.strictEqual(shortlistRes.isShortlisted, true, "Should shortlist startup");
  const shortlistData = await discoveryService.getShortlist(testUserId);
  assert.strictEqual(shortlistData.startups.length, 1, "Shortlist should contain saved startup");

  // 6. Cleanup
  console.log("Cleaning up test artifacts...");
  await Startup.deleteOne({ _id: newStartup._id });
  await Profile.deleteOne({ userId: testUserId });
  await Auth.deleteOne({ _id: testUserId });
  await discoveryService.toggleShortlist(testUserId, "STARTUP", newStartup._id);

  await disconnectDB();
  console.log("ALL INTEGRATION TESTS PASSED CLEANLY!");
}

runIntegrationTests().catch((err: any) => {
  console.error("Integration tests failed:", err);
  process.exit(1);
});
