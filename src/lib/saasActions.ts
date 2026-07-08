"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { getSession } from "./auth";
import { notify } from "./notify";
import { tplSaas } from "./notifyTemplates";

async function requireSuper() {
  const session = await getSession();
  if (session?.role !== "admin") return null;
  const admin = await prisma.admin.findUnique({ where: { id: session.userId } });
  return admin?.isSuper ? session : null;
}

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ===================== ORGANIZATIONS ===================== */

export const createOrganization = async (
  name: string,
  plan: "FREE" | "PRO" | "ENTERPRISE"
) => {
  if (!(await requireSuper())) return { success: false, error: "Super admins only" };
  if (!name.trim()) return { success: false, error: "Name required" };
  const slug = slugify(name);
  const exists = await prisma.organization.findUnique({ where: { slug } });
  if (exists) return { success: false, error: "An org with that name exists" };

  await prisma.organization.create({ data: { name: name.trim(), slug, plan } });
  revalidatePath("/superadmin");
  return { success: true };
};

export const assignMemberToOrg = async (
  orgId: number,
  username: string,
  type: "teacher" | "student"
) => {
  if (!(await requireSuper())) return { success: false, error: "Super admins only" };
  const u = username.trim();
  let memberEmail: string | null = null;
  let memberName = "";
  if (type === "teacher") {
    const t = await prisma.teacher.findUnique({ where: { username: u } });
    if (!t) return { success: false, error: "Instructor not found" };
    await prisma.teacher.update({ where: { id: t.id }, data: { organizationId: orgId } });
    memberEmail = t.email;
    memberName = t.name;
  } else {
    const s = await prisma.student.findUnique({ where: { username: u } });
    if (!s) return { success: false, error: "Learner not found" };
    await prisma.student.update({ where: { id: s.id }, data: { organizationId: orgId } });
    memberEmail = s.email;
    memberName = s.name;
  }

  // notify the member they were added to the org
  if (memberEmail) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    });
    if (org) {
      const t = tplSaas.orgAdded(memberName, org.name);
      await notify({ email: { to: memberEmail, subject: t.subject, html: t.html } });
    }
  }

  revalidatePath(`/org/${orgId}`);
  return { success: true };
};

export const removeMemberFromOrg = async (
  memberId: string,
  type: "teacher" | "student",
  orgId: number
) => {
  if (!(await requireSuper())) return;
  if (type === "teacher")
    await prisma.teacher.update({ where: { id: memberId }, data: { organizationId: null } });
  else
    await prisma.student.update({ where: { id: memberId }, data: { organizationId: null } });
  revalidatePath(`/org/${orgId}`);
};

/* ===================== AFFILIATES ===================== */

export const createAffiliate = async (data: {
  name: string;
  username: string;
  email?: string;
  code: string;
  commissionRate: number;
  password: string;
}) => {
  if (!(await requireSuper())) return { success: false, error: "Super admins only" };
  const { name, username, email, code, commissionRate, password } = data;
  if (!name.trim() || !username.trim() || !code.trim() || password.length < 6)
    return { success: false, error: "Fill all fields (password 6+ chars)" };

  // username unique across all login tables
  const [a, t, s, p, af] = await Promise.all([
    prisma.admin.findUnique({ where: { username } }),
    prisma.teacher.findUnique({ where: { username } }),
    prisma.student.findUnique({ where: { username } }),
    prisma.parent.findUnique({ where: { username } }),
    prisma.affiliate.findUnique({ where: { username } }),
  ]);
  if (a || t || s || p || af) return { success: false, error: "Username already taken" };

  const codeExists = await prisma.affiliate.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (codeExists) return { success: false, error: "Referral code already used" };

  const hashed = await bcrypt.hash(password, 10);
  await prisma.affiliate.create({
    data: {
      id: `aff_${Date.now()}`,
      name: name.trim(),
      username: username.trim(),
      email: email?.trim() || null,
      code: code.trim().toUpperCase(),
      commissionRate: Math.min(100, Math.max(0, Math.round(commissionRate || 20))),
      password: hashed,
    },
  });

  // welcome email with login credentials + referral code
  if (email?.trim()) {
    const t = tplSaas.affiliateWelcome(
      name.trim(),
      username.trim(),
      code.trim().toUpperCase(),
      password
    );
    await notify({ email: { to: email.trim(), subject: t.subject, html: t.html } });
  }

  revalidatePath("/superadmin");
  return { success: true };
};
