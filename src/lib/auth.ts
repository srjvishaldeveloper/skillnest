import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function resolveAuthSecret(): string {
  const value = process.env.AUTH_SECRET;
  if (value && value.length > 0) return value;
  // Never allow a hardcoded fallback secret in production — that lets anyone
  // forge a valid session. Fail fast there; permit a clearly-flagged dev value
  // locally only.
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET environment variable is required in production.");
  }
  console.warn("[auth] AUTH_SECRET is not set — using an insecure dev-only secret.");
  return "dev-only-insecure-secret-do-not-use-in-production";
}

const secret = new TextEncoder().encode(resolveAuthSecret());

const COOKIE_NAME = "session";

export type SessionPayload = {
  userId: string;
  role: string;
  username: string;
};

export async function signJWT(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signJWT(payload);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}
