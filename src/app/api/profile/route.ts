import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/profile  — current user's profile
 * PUT /api/profile  — update name, email, phone, bio, img
 */
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let user: any = null;

    if (session.role === "student") {
      user = await prisma.student.findUnique({
        where: { id: session.userId },
        select: { id: true, username: true, name: true, email: true, phone: true, img: true, sex: true, birthday: true, createdAt: true },
      });
    } else if (session.role === "teacher") {
      user = await prisma.teacher.findUnique({
        where: { id: session.userId },
        select: { id: true, username: true, name: true, email: true, phone: true, img: true, sex: true, birthday: true, createdAt: true },
      });
    } else if (session.role === "parent") {
      user = await prisma.parent.findUnique({
        where: { id: session.userId },
        select: { id: true, username: true, name: true, email: true, phone: true, img: true, createdAt: true },
      });
    } else if (session.role === "admin") {
      user = await prisma.admin.findUnique({
        where: { id: session.userId },
        select: { id: true, username: true, createdAt: true },
      });
    }

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ profile: { ...user, role: session.role } });
  } catch (error) {
    console.error("profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, img, sex, birthday } = body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (img !== undefined) updateData.img = img || null;

    // Email and phone updates require uniqueness check
    if (email !== undefined) {
      const normalized = String(email).toLowerCase().trim();
      const [s, t, p] = await Promise.all([
        prisma.student.findUnique({ where: { email: normalized } }),
        prisma.teacher.findUnique({ where: { email: normalized } }),
        prisma.parent.findUnique({ where: { email: normalized } }),
      ]);
      const taken = [s, t, p].find((u) => u && (u as any).id !== session.userId);
      if (taken) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
      }
      updateData.email = normalized;
    }

    if (phone !== undefined) {
      const normalized = String(phone).replace(/\D/g, "").slice(-10);
      if (normalized) updateData.phone = normalized;
    }

    if (session.role === "student") {
      if (sex !== undefined) updateData.sex = sex === "FEMALE" ? "FEMALE" : "MALE";
      if (birthday !== undefined) updateData.birthday = new Date(birthday);

      const updated = await prisma.student.update({
        where: { id: session.userId },
        data: updateData,
        select: { id: true, username: true, name: true, email: true, phone: true, img: true, sex: true, birthday: true },
      });
      return NextResponse.json({ profile: { ...updated, role: "student" } });
    }

    if (session.role === "teacher") {
      if (sex !== undefined) updateData.sex = sex === "FEMALE" ? "FEMALE" : "MALE";
      if (birthday !== undefined) updateData.birthday = new Date(birthday);

      const updated = await prisma.teacher.update({
        where: { id: session.userId },
        data: updateData,
        select: { id: true, username: true, name: true, email: true, phone: true, img: true, sex: true, birthday: true },
      });
      return NextResponse.json({ profile: { ...updated, role: "teacher" } });
    }

    if (session.role === "parent") {
      const updated = await prisma.parent.update({
        where: { id: session.userId },
        data: updateData,
        select: { id: true, username: true, name: true, email: true, phone: true, img: true },
      });
      return NextResponse.json({ profile: { ...updated, role: "parent" } });
    }

    return NextResponse.json({ error: "Profile update not supported for this role" }, { status: 403 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email or phone already taken" }, { status: 409 });
    }
    console.error("profile PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
