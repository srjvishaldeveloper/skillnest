import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.userId || (session.role !== "admin" && session.role !== "teacher")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contests = await prisma.contest.findMany({
    include: {
      problems: { select: { id: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json({ contests });
}
