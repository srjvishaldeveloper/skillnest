"use server";

import prisma from "./prisma";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";
import { initiatePayment } from "./phonepe";

export async function addToCart(courseId: number) {
  const session = await getSession();
  if (session?.role !== "student") return { error: "Please login as a student" };

  const existing = await prisma.cart.findUnique({
    where: { studentId_courseId: { studentId: session.userId, courseId } },
  });
  if (existing) return { error: "Already in cart" };

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { price: true, title: true },
  });
  if (!course) return { error: "Course not found" };

  await prisma.cart.create({
    data: { studentId: session.userId, courseId },
  });

  revalidatePath("/cart");
  revalidatePath(`/course/${courseId}`);
  revalidatePath("/browse");
  revalidatePath("/explore-courses");
  return { success: true };
}

export async function removeFromCart(courseId: number) {
  const session = await getSession();
  if (session?.role !== "student") return { error: "Unauthorized" };

  await prisma.cart.deleteMany({
    where: { studentId: session.userId, courseId },
  });

  revalidatePath("/cart");
  revalidatePath(`/course/${courseId}`);
  revalidatePath("/browse");
  revalidatePath("/explore-courses");
  return { success: true };
}

export async function getCartCount() {
  const session = await getSession();
  if (session?.role !== "student") return 0;

  const count = await prisma.cart.count({
    where: { studentId: session.userId },
  });
  return count;
}

export async function getCartItems() {
  const session = await getSession();
  if (session?.role !== "student") return [];

  const items = await prisma.cart.findMany({
    where: { studentId: session.userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          price: true,
          img: true,
          instructor: { select: { name: true } },
          reviews: { select: { rating: true } },
          _count: { select: { enrollments: true, modules: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    courseId: item.course.id,
    title: item.course.title,
    price: item.course.price,
    img: item.course.img,
    instructor: item.course.instructor.name,
    rating: item.course.reviews.length
      ? item.course.reviews.reduce((s, r) => s + r.rating, 0) / item.course.reviews.length
      : 0,
    enrollments: item.course._count.enrollments,
    modules: item.course._count.modules,
    createdAt: item.createdAt,
  }));
}

export async function isInCart(courseId: number) {
  const session = await getSession();
  if (session?.role !== "student") return false;

  const item = await prisma.cart.findUnique({
    where: { studentId_courseId: { studentId: session.userId, courseId } },
  });
  return !!item;
}

export async function checkoutCart() {
  const session = await getSession();
  if (session?.role !== "student") return { error: "Unauthorized" };

  const studentId = session.userId;

  const cartItems = await prisma.cart.findMany({
    where: { studentId },
    include: { course: { select: { id: true, title: true, price: true, instructorId: true } } },
  });

  if (cartItems.length === 0) return { error: "Cart is empty" };

  // Check for already enrolled courses
  const enrolled = await prisma.enrollment.findMany({
    where: { studentId, courseId: { in: cartItems.map((i) => i.courseId) } },
    select: { courseId: true },
  });
  const enrolledIds = new Set(enrolled.map((e) => e.courseId));
  const toBuy = cartItems.filter((i) => !enrolledIds.has(i.courseId));
  if (toBuy.length === 0) return { error: "Already enrolled in all courses" };

  const totalAmount = toBuy.reduce((s, i) => s + i.course.price, 0);
  if (totalAmount <= 0) {
    // All free courses - enroll directly
    for (const item of toBuy) {
      await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId, courseId: item.course.id } },
        create: { studentId, courseId: item.course.id },
        update: {},
      });
      await prisma.cart.deleteMany({ where: { studentId, courseId: item.course.id } });
    }
    revalidatePath("/cart");
    revalidatePath("/my-learning");
    return { success: true, free: true };
  }

  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  const merchantTxnId = `SNCART${ts}${rand}`;

  // Create checkout session
  const checkout = await prisma.cartCheckout.create({
    data: {
      merchantTxnId,
      studentId,
      totalAmount,
      items: {
        create: toBuy.map((i) => ({
          courseId: i.course.id,
          amount: i.course.price,
          courseTitle: i.course.title,
        })),
      },
    },
    include: { items: true },
  });

  // Initiate PhonePe payment
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const result = await initiatePayment({
      merchantTransactionId: merchantTxnId,
      amountPaise: totalAmount * 100,
      userId: studentId,
      redirectUrl: `${APP_URL}/payment/status?txn=${merchantTxnId}`,
      callbackUrl: `${APP_URL}/api/payment/phonepe/callback`,
    });

    if (result.ok && result.redirectUrl) {
      return { success: true, url: result.redirectUrl, merchantTxnId };
    }
    // Payment initiation failed
    await prisma.cartCheckout.update({
      where: { id: checkout.id },
      data: { status: "FAILED" },
    });
    return { error: result.error || "Payment initiation failed" };
  } catch (err: any) {
    await prisma.cartCheckout.update({
      where: { id: checkout.id },
      data: { status: "FAILED" },
    });
    return { error: err.message || "Payment failed" };
  }
}

export async function confirmCartCheckout(merchantTxnId: string) {
  const checkout = await prisma.cartCheckout.findUnique({
    where: { merchantTxnId },
    include: { items: true },
  });
  if (!checkout) return { error: "Checkout not found" };
  if (checkout.status === "PAID") return { success: true };
  if (checkout.status !== "PENDING") return { error: "Checkout already processed" };

  // Verify with PhonePe
  const { checkStatus } = await import("./phonepe");
  const statusResult = await checkStatus(merchantTxnId);

  if (statusResult.success && statusResult.status === "COMPLETED") {
    await prisma.$transaction(async (tx) => {
      await tx.cartCheckout.update({
        where: { id: checkout.id },
        data: { status: "PAID", paidAt: new Date() },
      });

      for (const item of checkout.items) {
        await tx.order.create({
          data: {
            merchantTxnId: `${merchantTxnId}_${item.courseId}`,
            baseAmount: item.amount,
            amount: item.amount,
            status: "PAID",
            paidAt: new Date(),
            paymentMethod: "PHONEPE",
            studentId: checkout.studentId,
            courseId: item.courseId,
          },
        });

        await tx.enrollment.upsert({
          where: {
            studentId_courseId: { studentId: checkout.studentId, courseId: item.courseId },
          },
          create: { studentId: checkout.studentId, courseId: item.courseId },
          update: {},
        });

        await tx.cart.deleteMany({
          where: { studentId: checkout.studentId, courseId: item.courseId },
        });
      }
    });

    revalidatePath("/cart");
    revalidatePath("/my-learning");
    return { success: true };
  }

  if (statusResult.status === "FAILED") {
    await prisma.cartCheckout.update({
      where: { id: checkout.id },
      data: { status: "FAILED" },
    });
    return { error: "Payment failed" };
  }

  return { pending: true };
}
