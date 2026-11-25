import assert from "node:assert";
import { app } from "../src/app.ts";

/**
 * Architectural and route registration verification tests.
 */

async function runArchitectureTests(): Promise<void> {
  console.log("Running Architecture and Route Registration Tests...");

  // 1. Verify Express App instance exists
  assert.ok(app, "Express app should be instantiated");
  assert.strictEqual(typeof app.listen, "function", "App should have listen method");

  // 2. Verify all expected routes are registered in Express router stack
  const registeredPaths: { path: string; methods: string[] }[] = [];

  function extractRoutes(stack: any[], prefix = ""): void {
    for (const layer of stack) {
      if (layer.route && layer.route.path) {
        const fullPath = prefix + layer.route.path;
        const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
        registeredPaths.push({ path: fullPath, methods });
      } else if (layer.name === "router" && layer.handle?.stack) {
        let routePrefix = prefix;
        if (layer.regexp) {
          const match = layer.regexp.source
            .replace("^\\", "")
            .replace("\\/?(?=\\/|$)", "")
            .replace(/\\\//g, "/")
            .replace(/\(\?:\(\[\^\\\/]\+\?\)\)/g, ":param")
            .replace(/\$/g, "");
          if (match && match !== "/" && !match.startsWith("^")) {
            routePrefix = prefix + match;
          }
        }
        extractRoutes(layer.handle.stack, routePrefix);
      }
    }
  }

  const router = (app as any).router || (app as any)._router;
  const rawPaths = router.stack.map((l: any) => l.rawPath).filter(Boolean);
  console.log(`Discovered ${rawPaths.length} mounted routers with paths:`, rawPaths);

  // Verify critical endpoints exist
  const criticalPrefixes = [
    "/post",
    "/api/auth",
    "/auth",
    "/user",
    "/onboarding",
    "/profile",
    "/api/profile",
    "/startup",
    "/api/startup",
    "/discovery",
    "/api/discovery",
    "/",
  ];

  for (const prefix of criticalPrefixes) {
    const found = rawPaths.includes(prefix);
    assert.ok(found, `Expected route mount for prefix "${prefix}" was not found.`);
  }

  // 3. Verify Module exports
  const authModule = await import("../src/modules/auth/index.ts");
  assert.ok(authModule.authRoutes, "Auth module must export authRoutes");
  assert.ok(authModule.Auth, "Auth module must export Auth model");
  assert.ok(authModule.authService, "Auth module must export authService");

  const onboardingModule = await import("../src/modules/onboarding/index.ts");
  assert.ok(onboardingModule.onboardingRoutes, "Onboarding module must export onboardingRoutes");
  assert.ok(onboardingModule.onboardingService, "Onboarding module must export onboardingService");

  const profilesModule = await import("../src/modules/profiles/index.ts");
  assert.ok(profilesModule.profileRoutes, "Profiles module must export profileRoutes");
  assert.ok(profilesModule.Profile, "Profiles module must export Profile model");
  assert.ok(profilesModule.profileService, "Profiles module must export profileService");

  const startupsModule = await import("../src/modules/startups/index.ts");
  assert.ok(startupsModule.startupRoutes, "Startups module must export startupRoutes");
  assert.ok(startupsModule.Startup, "Startups module must export Startup model");
  assert.ok(startupsModule.startupService, "Startups module must export startupService");

  const discoveryModule = await import("../src/modules/discovery/index.ts");
  assert.ok(discoveryModule.discoveryRoutes, "Discovery module must export discoveryRoutes");
  assert.ok(discoveryModule.Follow, "Discovery module must export Follow model");
  assert.ok(discoveryModule.Shortlist, "Discovery module must export Shortlist model");
  assert.ok(discoveryModule.discoveryService, "Discovery module must export discoveryService");

  const postsModule = await import("../src/modules/posts/index.ts");
  assert.ok(postsModule.postRoutes, "Posts module must export postRoutes");
  assert.ok(postsModule.Post, "Posts module must export Post model");

  const homeModule = await import("../src/modules/home/index.ts");
  assert.ok(homeModule.homeRoutes, "Home module must export homeRoutes");

  // 4. Verify Backward-Compatibility proxies
  const legacyAuthModel = await import("../models/auth.model.ts").catch(() => import("../models/auth.model.ts"));
  assert.strictEqual(legacyAuthModel.default, authModule.Auth, "Legacy auth model must re-export Auth");

  const legacyProfileModel = await import("../models/profile.model.ts").catch(() => import("../models/profile.model.ts"));
  assert.strictEqual(legacyProfileModel.default, profilesModule.Profile, "Legacy profile model must re-export Profile");

  const legacyStartupModel = await import("../models/startup.model.ts").catch(() => import("../models/startup.model.ts"));
  assert.strictEqual(legacyStartupModel.default, startupsModule.Startup, "Legacy startup model must re-export Startup");

  console.log("PASS: Architecture, route registration, and compatibility tests succeeded!");
}

runArchitectureTests().catch((err: any) => {
  console.error("Architecture tests failed:", err);
  process.exit(1);
});
