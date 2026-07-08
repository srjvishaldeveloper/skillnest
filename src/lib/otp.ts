import prisma from "./prisma";
import { SessionPayload } from "./auth";

export const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
export const OTP_MAX_ATTEMPTS = 5;

// Fast2SMS expects 10-digit Indian numbers.
export function normalizePhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  const ten = digits.slice(-10);
  return ten.length === 10 ? ten : null;
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

/**
 * Find a login-capable user (Student / Teacher / Parent) by phone.
 * Admins and affiliates have no phone field, so they use password login.
 * Matches the stored phone by its last 10 digits.
 */
export async function findUserByPhone(
  phone10: string
): Promise<SessionPayload | null> {
  // Stored phones may contain formatting (dashes/spaces), so normalize and
  // compare on the last 10 digits in JS.
  const last4 = phone10.slice(-4);
  const where = { phone: { contains: last4 } } as const;
  const sel = { id: true, username: true, phone: true };

  const [students, teachers, parents] = await Promise.all([
    prisma.student.findMany({ where, select: sel }),
    prisma.teacher.findMany({ where, select: sel }),
    prisma.parent.findMany({ where, select: sel }),
  ]);

  const norm = (p: string | null) => (p || "").replace(/\D/g, "").slice(-10);

  const s = students.find((x) => norm(x.phone) === phone10);
  if (s) return { userId: s.id, role: "student", username: s.username };
  const t = teachers.find((x) => norm(x.phone) === phone10);
  if (t) return { userId: t.id, role: "teacher", username: t.username };
  const p = parents.find((x) => norm(x.phone) === phone10);
  if (p) return { userId: p.id, role: "parent", username: p.username };
  return null;
}
