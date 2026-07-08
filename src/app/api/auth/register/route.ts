import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { tpl } from "@/lib/notifyTemplates";

export async function POST(request: Request) {
  try {
    const { name, username, email, phone, password, sex, profession, ref, studentUsername } =
      await request.json();

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Name, username and password are required" },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Username must be unique across all account types (login checks all tables)
    const [admin, teacher, student, parent] = await Promise.all([
      prisma.admin.findUnique({ where: { username } }),
      prisma.teacher.findUnique({ where: { username } }),
      prisma.student.findUnique({ where: { username } }),
      prisma.parent.findUnique({ where: { username } }),
    ]);
    if (admin || teacher || student || parent) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (profession === "teacher") {
      const id = `tch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      let parentTeacherId: string | undefined;
      let invitedByLinkId: number | undefined;

      if (ref) {
        const inviteLink = await prisma.teacherInviteLink.findUnique({
          where: { code: ref },
        });
        if (
          inviteLink &&
          !inviteLink.isRevoked &&
          inviteLink.expiresAt > new Date() &&
          inviteLink.useCount < inviteLink.maxUses
        ) {
          if (inviteLink.teacherId) parentTeacherId = inviteLink.teacherId;
          invitedByLinkId = inviteLink.id;
          await prisma.teacherInviteLink.update({
            where: { id: inviteLink.id },
            data: { useCount: { increment: 1 } },
          });
        }
      }

      const newTeacher = await prisma.teacher.create({
        data: {
          id,
          username,
          name,
          email: email || null,
          phone: (phone && String(phone).replace(/\D/g, "").slice(-10)) || null,
          address: "",
          bloodType: "",
          sex: sex === "FEMALE" ? "FEMALE" : "MALE",
          birthday: new Date("2000-01-01"),
          password: hashedPassword,
          isVerified: !!parentTeacherId,
          parentTeacherId,
          invitedByLinkId,
        },
      });

      await createSession({
        userId: newTeacher.id,
        role: "teacher",
        username: newTeacher.username,
      });

      if (newTeacher.email) {
        const t = tpl.welcome(newTeacher.name, newTeacher.username);
        await notify({
          email: { to: newTeacher.email, subject: t.subject, html: t.html },
        });
      }

      // Notify admin via announcement
      const verifiedStatus = newTeacher.isVerified ? "verified (via invite)" : "pending verification";
      await prisma.announcement.create({
        data: {
          title: `New teacher registered: ${newTeacher.name}`,
          description: `Teacher ${newTeacher.name} (${newTeacher.username}) has registered. Status: ${verifiedStatus}.`,
          date: new Date(),
          authorId: newTeacher.id,
          authorRole: "teacher",
          authorName: newTeacher.name,
          classId: null,
        },
      });

      return NextResponse.json({ role: "teacher", userId: newTeacher.id });
    }

    if (profession === "parent") {
      if (!studentUsername) {
        return NextResponse.json(
          { error: "Please provide your child's student username." },
          { status: 400 }
        );
      }

      const linkedStudent = await prisma.student.findUnique({
        where: { username: studentUsername },
      });
      if (!linkedStudent) {
        return NextResponse.json(
          { error: "Student username not found. Please double-check the spelling." },
          { status: 404 }
        );
      }

      const formattedPhone = (phone && String(phone).replace(/\D/g, "").slice(-10)) || "";
      if (!formattedPhone) {
        return NextResponse.json(
          { error: "Phone number is required for parents." },
          { status: 400 }
        );
      }

      const existingParentPhone = await prisma.parent.findUnique({
        where: { phone: formattedPhone },
      });
      if (existingParentPhone) {
        return NextResponse.json(
          { error: "This phone number is already registered to another parent." },
          { status: 409 }
        );
      }

      const parentId = `prn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newParent = await prisma.parent.create({
        data: {
          id: parentId,
          username,
          name,
          email: email || null,
          phone: formattedPhone,
          address: "",
          password: hashedPassword,
        },
      });

      await prisma.student.update({
        where: { id: linkedStudent.id },
        data: { parentId: newParent.id },
      });

      await createSession({
        userId: newParent.id,
        role: "parent",
        username: newParent.username,
      });

      if (newParent.email) {
        const t = tpl.welcome(newParent.name, newParent.username);
        await notify({
          email: { to: newParent.email, subject: t.subject, html: t.html },
        });
      }

      return NextResponse.json({ role: "parent", userId: newParent.id });
    }

    // Student registration
    const [grade, klass, guardian] = await Promise.all([
      prisma.grade.findFirst(),
      prisma.class.findFirst(),
      prisma.parent.findFirst(),
    ]);
    if (!grade || !klass || !guardian) {
      return NextResponse.json(
        {
          error:
            "Platform is not initialized yet. Please seed the database before registering.",
        },
        { status: 503 }
      );
    }

    const id = `stu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newStudent = await prisma.student.create({
      data: {
        id,
        username,
        name,
        email: email || null,
        phone: (phone && String(phone).replace(/\D/g, "").slice(-10)) || null,
        address: "",
        bloodType: "",
        sex: sex === "FEMALE" ? "FEMALE" : "MALE",
        birthday: new Date("2000-01-01"),
        gradeId: grade.id,
        classId: klass.id,
        parentId: guardian.id,
        password: hashedPassword,
      },
    });

    await createSession({
      userId: newStudent.id,
      role: "student",
      username: newStudent.username,
    });

    if (newStudent.email) {
      const t = tpl.welcome(newStudent.name, newStudent.username);
      await notify({
        email: { to: newStudent.email, subject: t.subject, html: t.html },
      });
    }

    return NextResponse.json({ role: "student", userId: newStudent.id });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An account with that email or username already exists" },
        { status: 409 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
