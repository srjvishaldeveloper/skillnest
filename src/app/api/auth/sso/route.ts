import { NextRequest, NextResponse } from "next/server";

import { loginWithSso } from "@/lib/sso";
import { signJWT } from "@/lib/auth";

/**
 * GET /api/auth/sso?token=<jobnest-sso-token>&redirect=/explore-courses
 *
 * SSO landing endpoint. A JobNest user is bounced here with a short-lived token
 * minted by Django (POST /api/v1/auth/sso/skillnest/). We verify it, JIT-
 * provision the local SkillNestProfile, set our own session cookie, then send
 * the user on to their destination — so a JobNest job seeker arrives already
 * signed in as a SkillNest student, with no second login.
 */

// Only allow same-site relative paths to avoid open redirects.
function safeRedirect(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/explore-courses";
  }
  return path;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const dest = safeRedirect(searchParams.get("redirect"));

  if (!token) {
    return NextResponse.redirect(new URL("/signin?error=sso_missing_token", req.url));
  }

  const result = await loginWithSso(token);
  if (!result) {
    return NextResponse.redirect(new URL("/signin?error=sso_invalid", req.url));
  }

  const { profile } = result;
  const sessionToken = await signJWT({
    userId: profile.jobnestUserId,
    role: profile.role,
    username: profile.username ?? profile.email ?? profile.jobnestUserId,
  });

  // Set the session cookie directly on the redirect response so it survives the
  // 302 (mirrors createSession's cookie options in lib/auth.ts).
  const res = NextResponse.redirect(new URL(dest, req.url));
  res.cookies.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return res;
}
