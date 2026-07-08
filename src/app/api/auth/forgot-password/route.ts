import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { emailLayout } from "@/lib/notifyTemplates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TOKEN_EXPIRY_MINUTES = 30;

function makeResetHtml(name: string, resetUrl: string) {
  return emailLayout(
    "Reset your SkillNest password",
    `<p>Hi ${name},</p>
     <p>Click the button below to reset your password. This link expires in ${TOKEN_EXPIRY_MINUTES} minutes.</p>
     <a href="${resetUrl}" style="display:inline-block;margin-top:14px;background:#2563EB;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold">Reset Password</a>
     <p style="margin-top:16px;font-size:12px;color:#9ca3af">If you didn't request this, you can safely ignore this email.</p>`
  );
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Find user across all account types that support email login
    const [student, teacher, parent] = await Promise.all([
      prisma.student.findUnique({ where: { email: emailLower } }),
      prisma.teacher.findUnique({ where: { email: emailLower } }),
      prisma.parent.findUnique({ where: { email: emailLower } }),
    ]);

    const user = student || teacher || parent;

    // Always respond 200 to avoid email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Reuse Otp table keyed by email for password-reset tokens
    await prisma.otp.upsert({
      where: { phone: `reset:${emailLower}` },
      create: {
        phone: `reset:${emailLower}`,
        code: token,
        expiresAt,
      },
      update: { code: token, expiresAt, attempts: 0 },
    });

    const name = (user as any).name || "there";
    const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(emailLower)}`;
    const html = makeResetHtml(name, resetUrl);

    await notify({
      email: {
        to: emailLower,
        subject: "Reset your SkillNest password",
        html,
      },
    });

    return NextResponse.json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("forgot-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
