import prisma from "./prisma";
import { checkStatus } from "./phonepe";
import { notify } from "./notify";
import { tpl, tplSaas } from "./notifyTemplates";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export type CouponResult =
  | { valid: true; percentOff: number; finalAmount: number; code: string | null }
  | { valid: false; reason: string };

/** Validate a coupon code against a base price (rupees). */
export async function getCouponDiscount(
  code: string | undefined,
  baseAmount: number
): Promise<CouponResult> {
  if (!code || !code.trim()) {
    return { valid: true, percentOff: 0, finalAmount: baseAmount, code: null };
  }
  const c = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!c || !c.active) return { valid: false, reason: "Invalid coupon code" };
  if (c.expiresAt && c.expiresAt < new Date())
    return { valid: false, reason: "Coupon has expired" };
  if (c.maxUses != null && c.usedCount >= c.maxUses)
    return { valid: false, reason: "Coupon usage limit reached" };

  const finalAmount = Math.max(
    0,
    Math.round((baseAmount * (100 - c.percentOff)) / 100)
  );
  return { valid: true, percentOff: c.percentOff, finalAmount, code: c.code };
}

export type ConfirmResult = {
  status: "PAID" | "FAILED" | "PENDING" | "NOTFOUND";
  courseId?: number;
  courseTitle?: string;
  amount?: number;
};

/**
 * Verify an order against PhonePe and, on success, mark it paid + enroll the
 * learner. Idempotent — safe to call from both the redirect page and the S2S
 * callback.
 */
export async function confirmOrder(merchantTxnId: string): Promise<ConfirmResult> {
  const order = await prisma.order.findUnique({
    where: { merchantTxnId },
    include: {
      course: { select: { title: true } },
      student: { select: { email: true, name: true } },
    },
  });
  if (!order) return { status: "NOTFOUND" };

  const base = {
    courseId: order.courseId,
    courseTitle: order.course.title,
    amount: order.amount,
  };

  if (order.status === "PAID") return { status: "PAID", ...base };

  const st = await checkStatus(merchantTxnId);

  if (st.success) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          phonepeTxnId: st.phonepeTxnId ?? null,
        },
      });
      await tx.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: order.studentId,
            courseId: order.courseId,
          },
        },
        create: { studentId: order.studentId, courseId: order.courseId },
        update: {},
      });
      if (order.couponCode) {
        await tx.coupon.updateMany({
          where: { code: order.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }
      // credit the affiliate who referred this sale
      if (order.referralCode) {
        const affiliate = await tx.affiliate.findUnique({
          where: { code: order.referralCode },
        });
        if (affiliate) {
          const commission = Math.round(
            (order.amount * affiliate.commissionRate) / 100
          );
          await tx.affiliateReferral.create({
            data: {
              affiliateId: affiliate.id,
              courseId: order.courseId,
              orderId: order.id,
              commission,
            },
          });
        }
      }
    });

    // payment success email
    if (order.student?.email) {
      const t = tpl.paymentSuccess(
        order.student.name,
        order.course.title,
        order.amount,
        order.id,
        order.courseId
      );
      await notify({
        email: { to: order.student.email, subject: t.subject, html: t.html },
      });
    }

    // affiliate commission email
    if (order.referralCode) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { code: order.referralCode },
        include: { referrals: { select: { commission: true } } },
      });
      if (affiliate?.email) {
        const total = affiliate.referrals.reduce((s, r) => s + r.commission, 0);
        const commission = Math.round(
          (order.amount * affiliate.commissionRate) / 100
        );
        const t = tplSaas.affiliateCommission(affiliate.name, commission, total);
        await notify({
          email: { to: affiliate.email, subject: t.subject, html: t.html },
        });
      }
    }

    return { status: "PAID", ...base };
  }

  if (st.state === "FAILED") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return { status: "FAILED", ...base };
  }

  return { status: "PENDING", ...base };
}
