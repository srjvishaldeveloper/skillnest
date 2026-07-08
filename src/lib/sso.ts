/**
 * HubNest SSO — verify a JobNest-issued SSO token and JIT-provision a local
 * SkillNestProfile keyed by the JobNest user id.
 *
 * Flow:
 *   1. The browser (already logged into JobNest) calls the Django endpoint
 *      POST /api/v1/auth/sso/skillnest/ which returns a short-lived token.
 *   2. SkillNest passes that token here. We verify it with the shared
 *      SSO_SIGNING_KEY (aud="skillnest", iss="jobnest"), upsert the profile,
 *      and then SkillNest issues its own session cookie (see lib/auth.ts).
 *
 * peeldb.User is the single identity; this module is the only place SkillNest
 * trusts an external token. Hardening target: RS256 + JWKS (no shared secret).
 */
import { createRemoteJWKSet, jwtVerify } from "jose";

import prisma from "./prisma";

export type SsoClaims = {
  sub: string; // peeldb.User.id (string)
  email?: string;
  username?: string;
  name?: string;
  user_type?: string;
  roles?: string[];
};

const AUDIENCE = "skillnest";
const ISSUER = "jobnest";

function ssoSecret(): Uint8Array {
  const value = process.env.SSO_SIGNING_KEY;
  if (!value || value.length === 0) {
    throw new Error("SSO_SIGNING_KEY environment variable is required for SSO.");
  }
  return new TextEncoder().encode(value);
}

// RS256 path: verify against JobNest's published JWKS (no shared secret). Cached
// across requests by jose. Set JOBNEST_JWKS_URL to enable, e.g.
// http://localhost:8000/api/v1/auth/sso/jwks/
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  const url = process.env.JOBNEST_JWKS_URL;
  if (!url) return null;
  if (!jwks) jwks = createRemoteJWKSet(new URL(url));
  return jwks;
}

/** Verify a JobNest SSO token. Returns claims or null when invalid/expired. */
export async function verifySsoToken(token: string): Promise<SsoClaims | null> {
  try {
    const remote = getJwks();
    const { payload } = remote
      ? await jwtVerify(token, remote, { audience: AUDIENCE, issuer: ISSUER })
      : await jwtVerify(token, ssoSecret(), { audience: AUDIENCE, issuer: ISSUER });
    if (!payload.sub) return null;
    return payload as unknown as SsoClaims;
  } catch {
    return null;
  }
}

/** LMS-side role label derived from the JobNest roles/user_type. */
function lmsRole(claims: SsoClaims): string {
  const roles = claims.roles || [];
  if (roles.includes("instructor")) return "teacher";
  if (roles.includes("admin")) return "admin";
  return "student";
}

/**
 * Upsert the local profile mirror for a verified JobNest identity (JIT
 * provisioning). Idempotent — keyed on jobnestUserId.
 */
export async function provisionProfile(claims: SsoClaims) {
  const role = lmsRole(claims);
  const profile = await prisma.skillNestProfile.upsert({
    where: { jobnestUserId: claims.sub },
    create: {
      jobnestUserId: claims.sub,
      email: claims.email ?? null,
      username: claims.username ?? null,
      name: claims.name ?? "",
      role,
      lastLoginAt: new Date(),
    },
    update: {
      email: claims.email ?? null,
      username: claims.username ?? null,
      name: claims.name ?? "",
      role,
      lastLoginAt: new Date(),
    },
  });

  // Mirror the learner into the Student table keyed by the JobNest user id, so
  // every LMS feature that filters on `studentId` (enrollments, lesson
  // progress, quizzes, certificates, code submissions) works for SSO users with
  // no extra wiring — the session's userId IS this Student.id. The username is
  // namespaced to avoid colliding with school-seeded students; email is left on
  // the SkillNestProfile to avoid the Student.email unique constraint.
  if (role === "student") {
    const displayName = (claims.name ?? "").trim() || claims.username || claims.email || "Learner";
    await prisma.student.upsert({
      where: { id: claims.sub },
      create: {
        id: claims.sub,
        username: `jn-${claims.sub}`,
        name: displayName,
      },
      update: {
        name: displayName,
      },
    });
  }

  return profile;
}

/** Verify + provision in one step. Returns the profile, or null when invalid. */
export async function loginWithSso(token: string) {
  const claims = await verifySsoToken(token);
  if (!claims) return null;
  const profile = await provisionProfile(claims);
  return { claims, profile };
}
