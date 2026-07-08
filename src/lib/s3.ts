import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const BUCKET_URL = (process.env.AWS_S3_BUCKET_URL || "").replace(/\/$/, "");
const CDN_DOMAIN = process.env.CLOUDFRONT_DOMAIN || "";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

/** Build public URL for a given S3 key, preferring CloudFront if configured. */
export function buildPublicUrl(key: string): string {
  if (CDN_DOMAIN) {
    const domain = CDN_DOMAIN.replace(/\/$/, "");
    return `${domain}/${key}`;
  }
  return `${BUCKET_URL}/${key}`;
}

/** Upload raw buffer to a pre-built S3 key. Returns public URL + key. */
export async function uploadToS3Key(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ url: string; key: string }> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return { url: buildPublicUrl(key), key };
}

export async function uploadToS3(
  buffer: Buffer,
  mimeType: string,
  folder: string,
  originalName: string
): Promise<{ url: string; key: string }> {
  const timestamp = Date.now();
  const safeName = sanitizeFilename(originalName || "upload.bin");
  const key = `${folder}/${timestamp}-${safeName}`;

  return uploadToS3Key(key, buffer, mimeType);
}

export async function deleteFromS3(key: string) {
  if (!key) return;
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.warn(`[S3] failed to delete ${key}:`, (err as Error).message);
  }
}

/** Delete all S3 objects sharing the given key prefix (e.g. "videos/12345/"). */
export async function deleteS3ByPrefix(keyPrefix: string) {
  if (!keyPrefix) return;
  try {
    let continuationToken: string | undefined;
    do {
      const listed = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: keyPrefix,
          ContinuationToken: continuationToken,
        })
      );
      const objects = (listed.Contents || []).map((o) => ({ Key: o.Key! })).filter((o) => o.Key);
      if (objects.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: objects, Quiet: true } })
        );
      }
      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);
  } catch (err) {
    console.warn(`[S3] failed to delete prefix ${keyPrefix}:`, (err as Error).message);
  }
}

/** Extract S3 key from a full S3 URL and delete it (including all HLS segment files if it's a playlist). No-op if url is empty. */
export async function deleteS3ByUrl(url: string | null | undefined) {
  if (!url) return;
  const prefix = BUCKET_URL + "/";
  if (!url.startsWith(prefix) && !(CDN_DOMAIN && url.startsWith(CDN_DOMAIN))) {
    console.warn(`[S3] cannot delete — URL doesn't match bucket or CDN: ${url.slice(0, 60)}`);
    return;
  }
  const key = CDN_DOMAIN ? url.replace(/^https?:\/\/[^/]+\//, "") : url.slice(prefix.length);

  // HLS playlist URL — delete all files under the same video folder
  if (key.endsWith("playlist.m3u8")) {
    const folderPrefix = key.replace(/\/[^/]+$/, "") + "/";
    await deleteS3ByPrefix(folderPrefix);
    return;
  }

  await deleteFromS3(key);
}
