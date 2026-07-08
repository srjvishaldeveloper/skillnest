"use server";

import prisma from "./prisma";
import { getSession } from "./auth";
import { ensureStudent } from "./learner";
import { initiatePayment, phonePeConfigured } from "./phonepe";
import { getCouponDiscount, APP_URL } from "./payments";

/** Live coupon check for the checkout UI. */
export const validateCoupon = async (code: string, courseId: number) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { price: true },
  });
  if (!course) return { valid: false as const, reason: "Course not found" };
  return getCouponDiscount(code, course.price);
};

/**
 * Create an order and start a PhonePe payment.
 * Returns { url } to redirect to PhonePe, { free: true } if a coupon zeroes the
 * price, or { error } on failure.
 */
export const startCheckout = async (
  courseId: number,
  couponCode?: string,
  referralCode?: string
) => {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return { error: "Sign in as a learner to purchase" };
  }

  // SSO learners may not have a Student row yet (e.g. a session issued before
  // the mirror existed). Create it before the order/enrollment FK writes.
  await ensureStudent(session);

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.published) return { error: "Course unavailable" };
  if (course.price <= 0) return { error: "This course is free — just enroll" };

  const already = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.userId, courseId } },
  });
  if (already) return { error: "You are already enrolled" };

  const disc = await getCouponDiscount(couponCode, course.price);
  if (!disc.valid) return { error: disc.reason };

  // coupon made it free → enroll directly, no payment needed
  if (disc.finalAmount <= 0) {
    await prisma.enrollment.create({
      data: { studentId: session.userId, courseId },
    });
    return { free: true as const };
  }

  if (!phonePeConfigured()) {
    return { error: "Payments are not configured on this server" };
  }

  const merchantTxnId = `SN${Date.now()}${Math.random()
    .toString(36)
    .slice(2, 6)}`.toUpperCase();

  await prisma.order.create({
    data: {
      merchantTxnId,
      baseAmount: course.price,
      amount: disc.finalAmount,
      status: "PENDING",
      couponCode: disc.code,
      referralCode: referralCode?.trim() || null,
      studentId: session.userId,
      courseId,
    },
  });

  const res = await initiatePayment({
    merchantTransactionId: merchantTxnId,
    amountPaise: disc.finalAmount * 100,
    userId: session.userId,
    redirectUrl: `${APP_URL}/payment/status?txn=${merchantTxnId}`,
    callbackUrl: `${APP_URL}/api/payment/phonepe/callback`,
  });

  if (!res.ok || !res.redirectUrl) {
    await prisma.order.update({
      where: { merchantTxnId },
      data: { status: "FAILED" },
    });
    return { error: res.error || "Could not start payment" };
  }

  return { url: res.redirectUrl };
};
