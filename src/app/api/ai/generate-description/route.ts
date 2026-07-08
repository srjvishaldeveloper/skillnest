import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callClaude, aiConfigured } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    // Allow teachers and admins to generate descriptions
    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!aiConfigured()) {
      return NextResponse.json(
        { error: "AI is not configured. Please add ANTHROPIC_API_KEY to your environment variables." },
        { status: 400 }
      );
    }

    const { title, category } = await req.json();
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Please enter a course title first to generate a description." },
        { status: 400 }
      );
    }

    const prompt = `Write a high-quality, professional, and engaging course description (between 300 to 500 characters) for an online course.
Course Title: "${title}"
Category: "${category || "General"}"

Keep it descriptive, exciting, and geared towards learners. Avoid markdown formatting like headers or lists. Just write 1 or 2 clean, paragraph-style descriptions.`;

    const result = await callClaude({
      system: "You are a professional course copywriter. Write a clean, high-converting, paragraph-style course description.",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 500,
    });

    if (!result.ok || !result.text) {
      return NextResponse.json(
        { error: result.error || "AI generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ description: result.text });
  } catch (error) {
    console.error("AI Description Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
  }
}
