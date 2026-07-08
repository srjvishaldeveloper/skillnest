import "dotenv/config";
import { Worker, Job } from "bullmq";
import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import { mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createRedisConnection } from "../src/lib/queue";
import { uploadToS3Key } from "../src/lib/s3";

const connection = createRedisConnection() as any;

const ffmpegDir = process.env.FFMPEG_DIR || "";
if (ffmpegDir) {
  const ext = process.platform === "win32" ? ".exe" : "";
  ffmpeg.setFfmpegPath(join(ffmpegDir, `ffmpeg${ext}`));
  ffmpeg.setFfprobePath(join(ffmpegDir, `ffprobe${ext}`));
  console.log(`[WORKER] FFmpeg paths set from FFMPEG_DIR: ${ffmpegDir}`);
}

const VIDEO_CRF = process.env.VIDEO_CRF || "26";
const AUDIO_BITRATE = process.env.AUDIO_BITRATE || "96k";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function rmdir(dir: string) {
  try { rmSync(dir, { recursive: true, force: true }); } catch { }
}

const worker = new Worker(
  "media-processing",
  async (job: Job) => {
    const data = job.data as {
      fileBuffer?: string;
      originalFilename?: string;
      folder?: string;
      alreadyCompressed?: boolean;
      existingUrl?: string;
      existingKey?: string;
    };
    const { fileBuffer, originalFilename, folder } = data;

    if (!fileBuffer || !originalFilename || !folder) {
      throw new Error(`Invalid job data: missing required fields`);
    }

    const inputPath = join(tmpdir(), `input-${Date.now()}-${sanitizeFilename(originalFilename)}`);
    writeFileSync(inputPath, Buffer.from(fileBuffer, "base64") as any);

    if (job.name === "compress-video") {
      if (data.alreadyCompressed) {
        console.log(`[WORKER] Job ${job.id}: video already compressed, skipping re-compression`);
        unlinkSync(inputPath);
        return { url: data.existingUrl, key: data.existingKey, alreadyCompressed: true };
      }

      const videoId = `${Date.now()}-${job.id}`;
      const hlsDir = join(tmpdir(), `hls-${videoId}`);
      mkdirSync(hlsDir, { recursive: true });

      try {
        const { duration, applyScale } = await new Promise<{ duration: number; applyScale: boolean }>((resolve) => {
          ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (err) {
              console.warn(`[WORKER] Job ${job.id}: ffprobe failed (${err.message}), falling back to safe scale`);
              resolve({ duration: 0, applyScale: true });
              return;
            }
            const duration = metadata.format.duration || 0;
            const videoStream = metadata.streams?.find((s: any) => s.codec_type === "video");
            const inputHeight = videoStream?.height || 0;
            const applyScale = inputHeight > 720;
            console.log(`[WORKER] Job ${job.id}: input height=${inputHeight}, applyScale=${applyScale}`);
            resolve({ duration, applyScale });
          });
        });

        await new Promise<void>((resolve, reject) => {
          const opts = [
            "-preset slow",
            `-crf ${VIDEO_CRF}`,
            "-g 48",
            "-sc_threshold 0",
            "-hls_time 6",
            "-hls_playlist_type vod",
            "-hls_segment_filename",
            join(hlsDir, "segment_%03d.ts"),
          ];

          let command = ffmpeg(inputPath)
            .videoCodec("libx264")
            .audioCodec("aac")
            .audioBitrate(AUDIO_BITRATE)
            .outputOptions(opts);

          if (applyScale) {
            command = command.videoFilters("scale=-2:720");
          }

          command
            .on("progress", (info) => {
              if (duration > 0 && info.timemark) {
                const parts = info.timemark.split(":").map(Number);
                const secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
                const pct = Math.min(Math.round((secs / duration) * 100), 99);
                job.updateProgress(pct).catch(() => {});
              }
            })
            .on("end", () => resolve())
            .on("error", (e) => reject(new Error(`ffmpeg error: ${e.message}`)))
            .save(join(hlsDir, "playlist.m3u8"));
        });

        const files = readdirSync(hlsDir);
        const uploads = files.map((f) => {
          const filePath = join(hlsDir, f);
          const buffer = readFileSync(filePath);
          const isPlaylist = f.endsWith(".m3u8");
          const contentType = isPlaylist ? "application/vnd.apple.mpegurl" : "video/mp2t";
          const s3Key = `videos/${videoId}/${f}`;
          return uploadToS3Key(s3Key, buffer, contentType);
        });

        const results = await Promise.all(uploads);
        const playlistResult = results.find((r) => r.key.endsWith("playlist.m3u8"))!;

        return {
          url: playlistResult.url,
          key: playlistResult.key,
          type: "hls",
          videoId,
        };
      } finally {
        unlinkSync(inputPath);
        rmdir(hlsDir);
      }
    }

    if (job.name === "compress-image") {
      const outputName = sanitizeFilename(originalFilename).replace(/\.[^/.]+$/, "") + ".webp";
      const outputPath = join(tmpdir(), `compressed-${Date.now()}-${outputName}`);

      try {
        const compressedBuffer = await sharp(inputPath)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const { url, key } = await uploadToS3Key(
          `images/${outputName}`,
          compressedBuffer,
          "image/webp"
        );

        return { url, key };
      } finally {
        unlinkSync(inputPath);
        try { unlinkSync(outputPath); } catch { }
      }
    }

    unlinkSync(inputPath);
    throw new Error(`Unknown job type: ${job.name}`);
  },
  {
    connection,
    concurrency: 2,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

worker.on("error", (err) => {
  console.error("[WORKER] General error:", err.message);
});

worker.on("failed", (job, err) => {
  console.error(`[WORKER] Job ${job?.id} (${job?.name}) failed after ${job?.attemptsMade} attempts:`, err.message);
});

worker.on("completed", (job) => {
  console.log(`[WORKER] Job ${job.id} (${job.name}) completed`);
});

console.log("[WORKER] media-worker started, waiting for jobs...");