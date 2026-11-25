import assert from "node:assert";
import { signupSchema, loginSchema } from "../src/modules/auth/auth.validation.ts";
import { roleSelectionSchema, profileSetupSchema } from "../src/modules/onboarding/onboarding.validation.ts";
import { updateProfileSchema, pastWorkSchema, privacySchema } from "../src/modules/profiles/profile.validation.ts";
import {
  startupPayloadSchema,
  inviteMemberSchema,
  openRolePayloadSchema,
  milestonePayloadSchema,
  transferOwnershipSchema,
} from "../src/modules/startups/startup.validation.ts";
import {
  followPayloadSchema,
  shortlistPayloadSchema,
  searchMembersQuerySchema,
} from "../src/modules/discovery/discovery.validation.ts";
import { validate } from "../src/middleware/validate.middleware.ts";

async function runValidationTests() {
  console.log("Running Zod API Input Validation Tests...");

  // 1. Auth Schemas
  console.log("Testing Auth validation...");
  const validSignup = signupSchema.safeParse({
    email: "builder@college.edu",
    password: "StrongPassword123!",
  });
  assert.strictEqual(validSignup.success, true, "Valid signup should pass");

  const invalidEmailSignup = signupSchema.safeParse({
    email: "not-an-email",
    password: "StrongPassword123!",
  });
  assert.strictEqual(invalidEmailSignup.success, false, "Invalid email should fail");

  const shortPassSignup = signupSchema.safeParse({
    email: "builder@college.edu",
    password: "short",
  });
  assert.strictEqual(shortPassSignup.success, false, "Password < 8 chars should fail");

  const validLogin = loginSchema.safeParse({
    email: "builder@college.edu",
    password: "anypassword",
  });
  assert.strictEqual(validLogin.success, true, "Valid login should pass");

  // 2. Onboarding Schemas
  console.log("Testing Onboarding validation...");
  const validRole = roleSelectionSchema.safeParse({ role: "FOUNDER" });
  assert.strictEqual(validRole.success, true);

  const invalidRole = roleSelectionSchema.safeParse({ role: "HACKER" });
  assert.strictEqual(invalidRole.success, false);

  const validProfileSetup = profileSetupSchema.safeParse({
    fullName: "Alex Sharma",
    college: "IIT Bombay",
    bio: "Building next-gen dev tools",
  });
  assert.strictEqual(validProfileSetup.success, true);

  const missingCollege = profileSetupSchema.safeParse({
    fullName: "Alex Sharma",
    college: "",
  });
  assert.strictEqual(missingCollege.success, false, "Missing college must fail");

  // 3. Profile Schemas
  console.log("Testing Profile validation...");
  const validPastWork = pastWorkSchema.safeParse({
    title: "Awesome App",
    url: "https://github.com/alex/awesome",
    linkType: "GitHub",
    description: "Built a great app",
  });
  assert.strictEqual(validPastWork.success, true);

  const badUrlWork = pastWorkSchema.safeParse({
    title: "Awesome App",
    url: "not-a-valid-url",
  });
  assert.strictEqual(badUrlWork.success, false, "Invalid URL must fail");

  // 4. Startup Schemas
  console.log("Testing Startup validation...");
  const validStartup = startupPayloadSchema.safeParse({
    name: "Begin App",
    pitch: "Campus networking for student builders and founders.",
    stage: "Building MVP",
    visibility: "PUBLIC",
  });
  assert.strictEqual(validStartup.success, true);

  const longPitch = startupPayloadSchema.safeParse({
    name: "Begin App",
    pitch: "x".repeat(201),
  });
  assert.strictEqual(longPitch.success, false, "Pitch > 200 chars must fail");

  const validTransferEmail = transferOwnershipSchema.safeParse({
    newOwnerEmail: "newowner@college.edu",
  });
  assert.strictEqual(validTransferEmail.success, true);

  const validTransferId = transferOwnershipSchema.safeParse({
    newOwnerId: "507f1f77bcf86cd799439011",
  });
  assert.strictEqual(validTransferId.success, true);

  const emptyTransfer = transferOwnershipSchema.safeParse({});
  assert.strictEqual(emptyTransfer.success, false, "Transfer without email or id must fail");

  // 5. Discovery Schemas
  console.log("Testing Discovery validation...");
  const validFollow = followPayloadSchema.safeParse({
    targetType: "STARTUP",
    targetId: "507f1f77bcf86cd799439011",
  });
  assert.strictEqual(validFollow.success, true);

  const badTargetId = followPayloadSchema.safeParse({
    targetType: "USER",
    targetId: "bad-id",
  });
  assert.strictEqual(badTargetId.success, false, "Malformed target ID must fail");

  // 6. Middleware Execution & Error Contract Test
  console.log("Testing validate() middleware contract...");
  let responseData: any = null;
  let responseStatus = 200;

  const mockRes: any = {
    status(code: number) {
      responseStatus = code;
      return this;
    },
    json(payload: any) {
      responseData = payload;
      return this;
    },
  };

  const middleware = validate({
    body: signupSchema,
  });

  const mockReq: any = {
    body: { email: "bad-email", password: "123" },
    query: {},
    params: {},
  };

  let nextCalled = false;
  await middleware(mockReq, mockRes, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false, "next() should not be called on validation error");
  assert.strictEqual(responseStatus, 400, "Should return HTTP 400");
  assert.strictEqual(responseData.success, false);
  assert.strictEqual(responseData.error.code, "VALIDATION_ERROR");
  assert.ok(Array.isArray(responseData.error.details), "Details must be an array of field errors");
  assert.ok(responseData.message, "Top-level message must be present for frontend compatibility");

  // 7. Test Express query getter compatibility (e.g. Google OAuth callback)
  console.log("Testing Express 5 query getter compatibility...");
  const express = (await import("express")).default;
  const expressReq = Object.create((express as any).request);
  Object.defineProperty(expressReq, "query", {
    get() {
      return { code: "google_auth_code_123", state: "state_val" };
    },
    enumerable: true,
    configurable: true,
  });

  const queryMiddleware = validate({
    query: (await import("../src/modules/auth/auth.validation.ts")).googleCallbackQuerySchema,
  });

  let queryNextCalled = false;
  await queryMiddleware(expressReq, mockRes, () => {
    queryNextCalled = true;
  });

  assert.strictEqual(queryNextCalled, true, "Query middleware must succeed on Express 5 getter");
  assert.strictEqual(expressReq.query.code, "google_auth_code_123", "Query code must be set");

  console.log("ALL ZOD VALIDATION TESTS PASSED CLEANLY!");
}

runValidationTests().catch((err) => {
  console.error("Validation tests failed:", err);
  process.exit(1);
});
