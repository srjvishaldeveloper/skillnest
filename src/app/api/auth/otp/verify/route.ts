import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { normalizePhone, findUserByPhone, OTP_MAX_ATTEMPTS } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();
    const phone10 = normalizePhone(phone || "");
    if (!phone10 || !code) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    const otp = await prisma.otp.findUnique({ where: { phone: phone10 } });
    if (!otp) {
      return NextResponse.json({ error: "Request an OTP first" }, { status: 400 });
    }
    if (otp.expiresAt < new Date()) {
      await prisma.otp.delete({ where: { phone: phone10 } }).catch(() => {});
      return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      await prisma.otp.delete({ where: { phone: phone10 } }).catch(() => {});
      return NextResponse.json({ error: "Too many attempts. Request a new OTP." }, { status: 429 });
    }

    const valid = await bcrypt.compare(String(code), otp.code);
    if (!valid) {
      await prisma.otp.update({
        where: { phone: phone10 },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Incorrect OTP" }, { status: 401 });
    }

    const user = await findUserByPhone(phone10);
    if (!user) {
      return NextResponse.json({ error: "Account no longer exists" }, { status: 404 });
    }

    await createSession(user);
    await prisma.otp.delete({ where: { phone: phone10 } }).catch(() => {});

    return NextResponse.json({ role: user.role, userId: user.userId });
  } catch (e) {
    console.error("OTP verify error:", e);
    return NextResponse.json({ error: "Could not verify OTP" }, { status: 500 });
  }
}
