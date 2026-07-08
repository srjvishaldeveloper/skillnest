"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import prisma from "./prisma";
import { getSession } from "./auth";

export const createInviteLink = async (formData: FormData) => {
  const session = await getSession();
  if (session?.role !== "teacher" && session?.role !== "admin") return { success: false, error: "Unauthorized" };

  const expiresAt = formData.get("expiresAt") as string;
  const maxUses = parseInt(formData.get("maxUses") as string) || 50;

  if (!expiresAt) return { success: false, error: "Expiry date is required" };

  const code = randomBytes(4).toString("hex");

  await prisma.teacherInviteLink.create({
    data: {
      ...(session.role === "teacher" ? { teacherId: session.userId } : {}),
      code,
      maxUses,
      expiresAt: new Date(expiresAt),
    },
  });

  revalidatePath("/list/invite-teachers");
  return { success: true, code };
};

export const revokeInviteLink = async (formData: FormData) => {
  const session = await getSession();
  if (session?.role !== "teacher" && session?.role !== "admin") return { success: false };

  const linkId = parseInt(formData.get("linkId") as string);
  if (!linkId) return { success: false };

  const link = await prisma.teacherInviteLink.findUnique({ where: { id: linkId } });
  if (!link) return { success: false };
  if (session.role === "teacher" && link.teacherId !== session.userId) return { success: false };

  await prisma.teacherInviteLink.update({
    where: { id: linkId },
    data: { isRevoked: true },
  });

  revalidatePath("/list/invite-teachers");
  return { success: true };
};

export const getInviteLinkData = async () => {
  const session = await getSession();
  if (!session?.userId) return { links: [] };

  const where = session.role === "admin"
    ? {}
    : { teacherId: session.userId };

  const links = await prisma.teacherInviteLink.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { invitedTeachers: true } },
      ...(session.role === "admin" ? { teacher: { select: { name: true } } } : {}),
    },
  });

  return { links };
};