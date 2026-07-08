import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, SessionPayload } from "@/lib/auth";
import { routeAccessMap } from "./lib/settings";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  route,
  allowedRoles: routeAccessMap[route],
}));

const LOGIN_PATH = "/signin";

// Public routes that never require authentication.
const PUBLIC_PATHS = ["/", "/signin", "/register", "/otp", "/forgot-password", "/reset-password", "/explore-courses"];
// Auth pages a logged-in user should be bounced away from.
const AUTH_PATHS = ["/signin", "/register", "/otp", "/forgot-password", "/reset-password"];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth API routes, public certificate verification, static files, and _next
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/payment") ||
    pathname.startsWith("/certificate/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Read session from cookie
  const token = req.cookies.get("session")?.value;
  let session: SessionPayload | null = null;
  if (token) {
    session = await verifyJWT(token);
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // If not authenticated: allow public routes, otherwise send to sign in
  if (!session) {
    if (isPublic) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
  }

  // If already authenticated and on an auth page, go to the dashboard
  if (AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL(`/${session.role}`, req.url));
  }

  // Check role-based access
  for (const { route, allowedRoles } of matchers) {
    const regex = new RegExp(`^${route.replace(/\(\.\*\)/g, ".*")}$`);
    if (regex.test(pathname) && !allowedRoles.includes(session.role)) {
      return NextResponse.redirect(new URL(`/${session.role}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
