import { NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { mediaQueue } from "@/lib/queue";

const ALLOWED_FOLDERS = new Set(["images", "videos", "pdfs", "screenshots", "assignments", "uploads"]);
const ASYNC_FOLDERS = new Set(["videos"]);
const MB = 1024 * 1024;
const GB = 1024 * MB;

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = ALLOWED_FOLDERS.has(searchParams.get("folder") || "")
      ? (searchParams.get("folder") as string)
      : "uploads";

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.size) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    if (folder === "videos" && file.size > 2 * GB) {
      return NextResponse.json({ error: "Video exceeds maximum size of 2GB" }, { status: 400 });
    }

    if (folder === "images" && file.size > 20 * MB) {
      return NextResponse.json({ error: "Image exceeds maximum size of 20MB" }, { status: 400 });
    }

    if (ASYNC_FOLDERS.has(folder)) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const jobType = folder === "videos" ? "compress-video" : "compress-image";
      const job = await mediaQueue.add(jobType, {
        fileBuffer: buffer.toString("base64"),
        originalFilename: file.name,
        folder,
      });

      return NextResponse.json({
        status: "processing",
        jobId: job.id,
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { url, key } = await uploadToS3(buffer, file.type || "application/octet-stream", folder, file.name || "upload.bin");

    return NextResponse.json({
      success: true,
      url,
      key,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
