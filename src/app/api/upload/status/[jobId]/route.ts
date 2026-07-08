import { NextRequest, NextResponse } from "next/server";
import { mediaQueue } from "@/lib/queue";

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await mediaQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const [state, progress, result] = await Promise.all([
      job.getState(),
      job.progress,
      job.returnvalue,
    ]);

    const isFailed = await job.isFailed();

    return NextResponse.json({
      status: state,
      progress: typeof progress === "number" ? progress : 0,
      result: result || null,
      error: isFailed ? (job.failedReason || "Unknown error") : null,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: "Failed to get job status" }, { status: 500 });
  }
}
