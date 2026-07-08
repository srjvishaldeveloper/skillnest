import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId || session.role !== "student") {
    return NextResponse.json({ error: "Sign in as a learner to purchase" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { courseId, merchantTxnId, amount, baseAmount, couponCode, referralCode, paymentProof } = body;

    if (!courseId || !merchantTxnId || !amount || !paymentProof) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || !course.published) {
      return NextResponse.json({ error: "Course unavailable" }, { status: 400 });
    }
    if (course.price <= 0) {
      return NextResponse.json({ error: "This course is free — just enroll" }, { status: 400 });
    }

    const already = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.userId, courseId } },
    });
    if (already) {
      return NextResponse.json({ error: "You are already enrolled" }, { status: 409 });
    }

    const existing = await prisma.order.findUnique({ where: { merchantTxnId } });
    if (existing) {
      return NextResponse.json({ error: "Duplicate transaction" }, { status: 409 });
    }

    await prisma.order.create({
      data: {
        merchantTxnId,
        baseAmount: baseAmount || amount,
        amount,
        status: "PENDING",
        couponCode: couponCode?.trim() || null,
        referralCode: referralCode?.trim() || null,
        paymentMethod: "BANK_TRANSFER",
        paymentProof,
        studentId: session.userId,
        courseId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("manual payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
