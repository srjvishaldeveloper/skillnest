import { NextResponse } from "next/server";
import { getJudge0Result } from "@/lib/judge0";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const result = await getJudge0Result(token);

    return NextResponse.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status,
      time: result.time,
      memory: result.memory,
    });
  } catch (error) {
    console.error("Code result poll error:", error);
    return NextResponse.json(
      { error: "Failed to get result", details: String(error) },
      { status: 500 }
    );
  }
}
