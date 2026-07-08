import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "token, email, and password are required" },
        { status: 400 }
      );
    }
    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const emailLower = String(email).toLowerCase().trim();
    const key = `reset:${emailLower}`;

    const record = await prisma.otp.findUnique({ where: { phone: key } });
    if (!record || record.code !== token) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      await prisma.otp.delete({ where: { phone: key } });
      return NextResponse.json({ error: "Reset link has expired. Request a new one." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Update whichever account type owns this email
    const [s, t, p] = await Promise.all([
      prisma.student.findUnique({ where: { email: emailLower } }),
      prisma.teacher.findUnique({ where: { email: emailLower } }),
      prisma.parent.findUnique({ where: { email: emailLower } }),
    ]);

    if (s) {
      await prisma.student.update({ where: { id: s.id }, data: { password: hashed } });
    } else if (t) {
      await prisma.teacher.update({ where: { id: t.id }, data: { password: hashed } });
    } else if (p) {
      await prisma.parent.update({ where: { id: p.id }, data: { password: hashed } });
    } else {
      return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
    }

    // Invalidate the token
    await prisma.otp.delete({ where: { phone: key } });

    return NextResponse.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
