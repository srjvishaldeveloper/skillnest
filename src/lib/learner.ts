import prisma from "./prisma";
import type { SessionPayload } from "./auth";

/**
 * Ensure a Student row exists for an SSO learner session before any write that
 * references it by foreign key (enrollments, orders, progress). Idempotent —
 * safe to call on every such action, including for sessions that were issued
 * before the Student mirror existed. Mirrors the username scheme used by
 * provisionProfile (jn-<jobnestUserId>) so it never collides with school
 * students and never creates a duplicate row.
 */
export async function ensureStudent(session: SessionPayload): Promise<void> {
  if (session.role !== "student") return;
  await prisma.student.upsert({
    where: { id: session.userId },
    create: {
      id: session.userId,
      username: `jn-${session.userId}`,
      name: session.username || "Learner",
    },
    update: {},
  });
}
