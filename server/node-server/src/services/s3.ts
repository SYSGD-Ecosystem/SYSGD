import AWS from "aws-sdk";

export const s3 = new AWS.S3({
  endpoint: process.env.AWS_ENDPOINT,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "sysgd-uploads";

export function extractKeyFromUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // If it's already a key-like string, return as-is (or without bucket prefix)
  if (!trimmed.includes("://")) {
    if (trimmed.startsWith(`${BUCKET_NAME}/`)) {
      return trimmed.slice(BUCKET_NAME.length + 1);
    }
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const pathname = decodeURIComponent(url.pathname || "");

    // Path-style: https://endpoint/bucket/key
    if (pathname.startsWith(`/${BUCKET_NAME}/`)) {
      return pathname.slice(BUCKET_NAME.length + 2);
    }

    // Virtual-host: https://bucket.endpoint/key
    if (url.host.startsWith(`${BUCKET_NAME}.`)) {
      return pathname.startsWith("/") ? pathname.slice(1) : pathname;
    }

    // Fallback: strip leading slash
    return pathname.startsWith("/") ? pathname.slice(1) : pathname;
  } catch {
    return null;
  }
}

export async function deleteObjectByUrl(rawUrl: string): Promise<{
  deleted: boolean;
  key?: string;
}> {
  const key = extractKeyFromUrl(rawUrl);
  if (!key) return { deleted: false };

  await s3
    .deleteObject({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    .promise();

  return { deleted: true, key };
}
