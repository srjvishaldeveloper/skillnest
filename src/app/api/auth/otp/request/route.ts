import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendOtp } from "@/lib/notify";
import {
  normalizePhone,
  generateOtp,
  findUserByPhone,
  OTP_EXPIRY_MINUTES,
} from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    const phone10 = normalizePhone(phone || "");
    if (!phone10) {
      return NextResponse.json({ error: "Enter a valid 10-digit phone" }, { status: 400 });
    }

    const user = await findUserByPhone(phone10);
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this phone number" },
        { status: 404 }
      );
    }

    const code = generateOtp();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otp.upsert({
      where: { phone: phone10 },
      create: { phone: phone10, code: codeHash, expiresAt, attempts: 0 },
      update: { code: codeHash, expiresAt, attempts: 0 },
    });

    // dev convenience: log the OTP so it can be tested without live SMS
    if (process.env.NODE_ENV !== "production") {
      console.log(`[OTP] ${phone10} -> ${code}`);
    }

    await sendOtp(phone10, code);

    return NextResponse.json({ success: true, expiresIn: OTP_EXPIRY_MINUTES });
  } catch (e) {
    console.error("OTP request error:", e);
    return NextResponse.json({ error: "Could not send OTP" }, { status: 500 });
  }
}
