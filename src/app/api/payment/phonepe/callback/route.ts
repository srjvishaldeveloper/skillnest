import { NextResponse } from "next/server";
import { confirmOrder } from "@/lib/payments";
import { confirmCartCheckout } from "@/lib/cartActions";
import prisma from "@/lib/prisma";

// PhonePe v2 server-to-server callback (no user session).
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const merchantOrderId =
      body?.payload?.merchantOrderId ||
      body?.merchantOrderId ||
      body?.data?.merchantOrderId;
    if (!merchantOrderId) return NextResponse.json({ ok: true });

    // Check if this is a cart checkout (starts with SNCART)
    if (merchantOrderId.startsWith("SNCART")) {
      await confirmCartCheckout(merchantOrderId);
    } else {
      await confirmOrder(merchantOrderId);
    }
  } catch {
    // PhonePe just needs a 200
  }
  return NextResponse.json({ ok: true });
}
