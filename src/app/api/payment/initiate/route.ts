import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { startCheckout } from "@/lib/paymentActions";

/**
 * POST /api/payment/initiate
 * Body: { courseId: number, couponCode?: string, referralCode?: string }
 *
 * Returns:
 *   { url: string }     → redirect to PhonePe checkout
 *   { free: true }      → coupon made it free, enrolled directly
 *   { error: string }   → validation or config error
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId || session.role !== "student") {
    return NextResponse.json({ error: "Sign in as a learner to purchase" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const courseId = Number(body.courseId);
    if (!courseId || isNaN(courseId)) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const result = await startCheckout(
      courseId,
      body.couponCode?.trim() || undefined,
      body.referralCode?.trim() || undefined
    );

    if ("error" in result) {
      const status = result.error === "You are already enrolled" ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("payment/initiate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/payment/initiate?coupon=CODE&courseId=123
 * Validate coupon and return discounted price without creating an order.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = Number(searchParams.get("courseId"));
  const coupon = searchParams.get("coupon") || "";

  if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });

  try {
    const { getCouponDiscount } = await import("@/lib/payments");
    const { default: prisma } = await import("@/lib/prisma");

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true, title: true },
    });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const discount = await getCouponDiscount(coupon, course.price);
    return NextResponse.json({
      courseId,
      courseTitle: course.title,
      basePrice: course.price,
      discount,
    });
  } catch (error) {
    console.error("payment/initiate GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
