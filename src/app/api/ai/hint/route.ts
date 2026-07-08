import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getHint } from "@/lib/aiTutor";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { problemSlug, code } = await req.json();
    if (!problemSlug) {
      return NextResponse.json({ error: "Missing problemSlug" }, { status: 400 });
    }

    const result = await getHint(problemSlug, code || "");
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ response: result.text });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get hint" }, { status: 500 });
  }
}
