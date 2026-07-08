import { NextResponse } from "next/server";
import { runCode, LANGUAGES } from "@/lib/judge0";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { source, languageId, stdin } = await req.json();

    if (!source || !languageId) {
      return NextResponse.json(
        { error: "Missing source or languageId" },
        { status: 400 }
      );
    }

    // Validate language
    const langEntry = Object.values(LANGUAGES).find((l) => l.id === languageId);
    if (!langEntry) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 }
      );
    }

    const result = await runCode(source, languageId, stdin || "");

    return NextResponse.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status,
      time: result.time,
      memory: result.memory,
    });
  } catch (error) {
    console.error("Code run error:", error);
    return NextResponse.json(
      { error: "Code execution failed", details: String(error) },
      { status: 500 }
    );
  }
}
