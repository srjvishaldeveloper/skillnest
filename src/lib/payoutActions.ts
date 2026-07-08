"use server";

import prisma from "./prisma";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";

export async function getAdminBankDetail() {
  const session = await getSession();
  if (!session) return null;

  const admin = await prisma.admin.findFirst({ orderBy: { isSuper: "desc" } });
  if (!admin) return null;

  const detail = await prisma.adminBankDetail.findUnique({
    where: { adminId: admin.id },
  });
  return detail;
}

export async function saveAdminBankDetail(data: {
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  accountHolderName?: string;
}) {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Unauthorized" };

  const admin = await prisma.admin.findUnique({ where: { id: session.userId } });
  if (!admin) return { error: "Admin not found" };

  await prisma.adminBankDetail.upsert({
    where: { adminId: session.userId },
    create: { adminId: session.userId, ...data },
    update: { ...data },
  });

  revalidatePath("/admin/bank-details");
  return { success: true };
}

export async function getCoursePlatformFee(courseId: number) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { platformFeePercent: true },
  });
  return course?.platformFeePercent ?? 0;
}

export async function setCoursePlatformFee(courseId: number, percent: number) {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Unauthorized" };
  if (percent < 1 || percent > 100) return { error: "Platform fee must be between 1% and 100%" };

  await prisma.course.update({
    where: { id: courseId },
    data: { platformFeePercent: Math.max(1, Math.min(100, percent)) },
  });

  revalidatePath(`/course/${courseId}`);
  revalidatePath("/instructor/analytics");
  revalidatePath("/admin/approvals");
  return { success: true };
}

export async function submitWithdrawalRequest(courseId?: number) {
  const session = await getSession();
  if (session?.role !== "teacher") return { error: "Unauthorized" };

  const teacherId = session.userId;

  // build where clause: filter by course if per-course withdrawal
  const orderWhere: any = {
    status: "PAID",
    course: { instructorId: teacherId },
  };
  if (courseId) {
    orderWhere.courseId = courseId;
  }

  const paidOrders = await prisma.order.findMany({
    where: orderWhere,
    include: {
      course: { select: { platformFeePercent: true, title: true } },
    },
  });

  const total = paidOrders.reduce((s, o) => s + o.amount, 0);
  if (total <= 0) return { error: "No earnings to withdraw" };

  // if per-course withdrawal, check no pending request for that course
  if (courseId) {
    const existing = await prisma.withdrawalRequest.findFirst({
      where: { teacherId, courseId, status: "PENDING" },
    });
    if (existing) return { error: "You already have a pending withdrawal request for this course" };
  } else {
    const existing = await prisma.withdrawalRequest.findFirst({
      where: { teacherId, status: "PENDING" },
    });
    if (existing) return { error: "You already have a pending withdrawal request" };
  }

  let totalFee = 0;
  for (const order of paidOrders) {
    const feePct = order.course.platformFeePercent;
    if (feePct > 0) {
      totalFee += Math.round(order.amount * feePct / 100);
    }
  }
  const netAmount = total - totalFee;
  const effectiveFeePercent = total > 0 ? Math.round(totalFee / total * 100) : 0;

  const courseTitle = courseId ? paidOrders[0]?.course.title || `course #${courseId}` : null;

  await prisma.withdrawalRequest.create({
    data: {
      teacherId,
      amount: total,
      platformFeePercent: effectiveFeePercent,
      platformFee: totalFee,
      netAmount,
      courseId: courseId || null,
    },
  });

  // Notify admin
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { name: true },
  });
  const teacherName = teacher?.name || "A teacher";
  const desc = courseTitle
    ? `₹${total} withdrawal requested for "${courseTitle}" (fee: ₹${totalFee}, net: ₹${netAmount}).`
    : `₹${total} withdrawal requested (fee: ₹${totalFee}, net: ₹${netAmount}).`;
  await prisma.announcement.create({
    data: {
      title: `Withdrawal request from ${teacherName}${courseTitle ? ` — ${courseTitle}` : ""}`,
      description: desc,
      date: new Date(),
      authorId: teacherId,
      authorRole: "teacher",
      authorName: teacherName,
      classId: null,
    },
  });

  revalidatePath("/instructor/analytics");
  revalidatePath("/admin/payouts");
  return { success: true };
}

export async function processWithdrawalRequest(
  requestId: number,
  status: "PROCESSED" | "REJECTED",
  data: {
    billUrl?: string;
    notes?: string;
    amount?: number;
    platformFee?: number;
    netAmount?: number;
    platformFeePercent?: number;
  }
) {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Unauthorized" };

  const updateData: any = {
    status,
    notes: data.notes || null,
    processedById: session.userId,
    processedAt: new Date(),
  };
  if (data.billUrl) updateData.billUrl = data.billUrl;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.platformFee !== undefined) updateData.platformFee = data.platformFee;
  if (data.netAmount !== undefined) updateData.netAmount = data.netAmount;
  if (data.platformFeePercent !== undefined) updateData.platformFeePercent = data.platformFeePercent;

  const req = await prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: updateData,
    include: { teacher: { select: { name: true, id: true } }, course: { select: { title: true } } },
  });

  const courseLabel = req.course ? ` for "${req.course.title}"` : "";

  // Notify teacher via announcement
  await prisma.announcement.create({
    data: {
      title: status === "PROCESSED" ? `Payout Completed: ₹${req.amount}${courseLabel}` : `Payout Cancelled: ₹${req.amount}${courseLabel}`,
      description: status === "PROCESSED"
        ? `Your payout request #${requestId} for ₹${req.amount}${courseLabel} has been processed and paid out.${data.notes ? ` Reference: ${data.notes}` : ""}`
        : `Your payout request #${requestId} for ₹${req.amount}${courseLabel} has been cancelled by Admin. Reason: ${data.notes || "No reason specified"}.`,
      date: new Date(),
      authorId: req.teacher.id,
      authorRole: "admin",
      authorName: "Admin",
      classId: null,
    },
  });

  revalidatePath("/admin/payouts");
  return { success: true };
}

export async function updateTeacherBankDetails(data: {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
}) {
  const session = await getSession();
  if (session?.role !== "teacher") return { error: "Unauthorized" };

  await prisma.teacher.update({
    where: { id: session.userId },
    data,
  });

  revalidatePath("/instructor/analytics");
  return { success: true };
}

export async function getTeacherBalance(teacherId: string, courseId?: number) {
  const orderWhere: any = {
    status: "PAID",
    course: { instructorId: teacherId },
  };
  if (courseId) {
    orderWhere.courseId = courseId;
  }

  const paidOrders = await prisma.order.findMany({
    where: orderWhere,
    include: {
      course: { select: { platformFeePercent: true } },
    },
  });

  const gross = paidOrders.reduce((s, o) => s + o.amount, 0);

  let totalFee = 0;
  for (const order of paidOrders) {
    const feePct = order.course.platformFeePercent;
    if (feePct > 0) {
      totalFee += Math.round(order.amount * feePct / 100);
    }
  }

  // for per-course: only count withdrawals for that specific course
  const withdrawalWhere: any = { teacherId, status: "PROCESSED" };
  if (courseId) {
    withdrawalWhere.courseId = courseId;
  }

  const processed = await prisma.withdrawalRequest.findMany({
    where: withdrawalWhere,
    select: { netAmount: true },
  });
  const withdrawn = processed.reduce((s, w) => s + w.netAmount, 0);

  const net = gross - totalFee;
  const available = net - withdrawn;

  const effectiveFeePercent = gross > 0 ? Math.round(totalFee / gross * 100) : 0;

  return { gross, feePercent: effectiveFeePercent, totalFee, net, withdrawn, available };
}

export async function approveSubTeacherRequest(requestId: number) {
  const session = await getSession();
  if (session?.role !== "teacher") return { error: "Unauthorized" };

  const req = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
    include: { teacher: { select: { parentTeacherId: true } } },
  });

  if (!req) return { error: "Request not found" };
  if (req.teacher.parentTeacherId !== session.userId) return { error: "Not your sub-teacher" };
  if (req.parentApproved) return { error: "Already approved" };

  await prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: { parentApproved: true },
  });

  revalidatePath("/instructor/analytics");
  revalidatePath("/admin/payouts");
  return { success: true };
}

export async function markSubTeacherPaid(requestId: number) {
  const session = await getSession();
  if (session?.role !== "teacher") return { error: "Unauthorized" };

  const req = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
    include: { teacher: { select: { parentTeacherId: true } } },
  });

  if (!req) return { error: "Request not found" };
  if (req.teacher.parentTeacherId !== session.userId) return { error: "Not your sub-teacher" };
  if (req.status !== "PROCESSED") return { error: "Request not yet processed by admin" };
  if (req.paidToSubAt) return { error: "Already marked as paid" };

  await prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: { paidToSubAt: new Date() },
  });

  revalidatePath("/instructor/analytics");
  revalidatePath("/teacher/payouts");
  return { success: true };
}

export async function processSubTeacherPayout(
  requestId: number,
  data: {
    billUrl?: string;
    notes?: string;
    feePercent?: number;
    feeAmount?: number;
    netAmount?: number;
  }
) {
  const session = await getSession();
  if (session?.role !== "teacher") return { error: "Unauthorized" };

  const req = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
    include: { teacher: { select: { id: true, name: true, parentTeacherId: true } } },
  });

  if (!req) return { error: "Request not found" };
  if (req.teacher.parentTeacherId !== session.userId) return { error: "Not your sub-teacher" };

  const parentTeacher = await prisma.teacher.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });

  const parentName = parentTeacher?.name || "Parent Teacher";
  const finalNet = data.netAmount !== undefined ? data.netAmount : req.netAmount;

  await prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: {
      paidToSubAt: new Date(),
      parentApproved: true,
    },
  });

  // Send announcement to sub-teacher
  await prisma.announcement.create({
    data: {
      title: `Payout Transferred: ₹${finalNet}`,
      description: `Your Parent Teacher (${parentName}) has transferred your payout of ₹${finalNet} (after charges).${data.notes ? ` Notes: ${data.notes}` : ""}`,
      date: new Date(),
      authorId: req.teacher.id,
      authorRole: "teacher",
      authorName: parentName,
      classId: null,
    },
  });

  revalidatePath("/instructor/analytics");
  revalidatePath("/teacher/payouts");
  revalidatePath("/admin/payouts");
  return { success: true };
}

export async function confirmManualPayment(orderId: number) {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Unauthorized" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { course: true },
  });
  if (!order) return { error: "Order not found" };
  if (order.status !== "PENDING") return { error: "Order already processed" };

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentConfirmedAt: new Date(),
        paymentConfirmedBy: session.userId,
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
  });

  revalidatePath("/admin/payments");
  revalidatePath("/payment/status");
  return { success: true };
}

async function getTeacherCoursesAndSales(instructorId: string) {
  const [courses, paidOrders] = await Promise.all([
    prisma.course.findMany({
      where: { instructorId },
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { status: "PAID", course: { instructorId } },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        paidAt: true,
        course: { select: { title: true } },
        student: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    coursesCount: courses.length,
    salesCount: paidOrders.length,
    courses,
    paidOrders,
  };
}

export async function getTeacherProfileWithStats(teacherId: string) {
  try {
    const session = await getSession();
    if (session?.role !== "admin" && session?.role !== "teacher") {
      return { success: false, error: "Unauthorized" };
    }

    let teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { id: teacherId },
          { username: teacherId },
          { name: teacherId },
          { email: teacherId },
        ],
      },
      include: {
        parentTeacher: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            accountHolderName: true,
            bankName: true,
            accountNumber: true,
            ifsc: true,
            upiId: true,
            panNumber: true,
            aadharNumber: true,
            certificateUrl: true,
          },
        },
      },
    });

    if (!teacher) {
      teacher = {
        id: teacherId,
        username: teacherId,
        name: teacherId,
        email: null,
        phone: null,
        address: "N/A",
        img: null,
        bloodType: "N/A",
        sex: "MALE",
        createdAt: new Date(),
        isVerified: true,
        verifiedAt: new Date(),
        birthday: new Date(),
        onboardingComplete: true,
        organizationId: null,
        parentTeacherId: null,
        parentTeacher: null,
        accountHolderName: null,
        bankName: null,
        accountNumber: null,
        ifsc: null,
        upiId: null,
        panNumber: null,
        aadharNumber: null,
        certificateUrl: null,
      } as any;
    }

    let stats = { coursesCount: 0, salesCount: 0, courses: [], paidOrders: [] };
    try {
      stats = await getTeacherCoursesAndSales(teacher.id);
    } catch (e) {
      console.error("[getTeacherCoursesAndSales failed]:", e);
    }

    let parentStats = null;
    if (teacher.parentTeacher) {
      try {
        parentStats = await getTeacherCoursesAndSales(teacher.parentTeacher.id);
      } catch (e) {
        console.error("[getParentCoursesAndSales failed]:", e);
      }
    }

    return {
      success: true,
      teacher,
      stats,
      parentStats,
    };
  } catch (err: any) {
    console.error("[getTeacherProfileWithStats failed]:", err);
    return { success: false, error: err?.message || "Could not load profile" };
  }
}


