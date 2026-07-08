import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { merchantTxnId, screenshotUrl } = await req.json();
    if (!merchantTxnId || !screenshotUrl) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { merchantTxnId },
      select: { id: true, studentId: true, status: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.studentId !== session.userId) {
      return NextResponse.json({ error: "Not your order" }, { status: 403 });
    }
    if (order.status !== "PAID") {
      return NextResponse.json({ error: "Payment not completed yet" }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentProof: screenshotUrl },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("screenshot upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
