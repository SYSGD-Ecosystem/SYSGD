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

const KNOWN_S3_PREFIX =
	"https://yneoruruvlbgffpdyiya.storage.supabase.co/storage/v1/s3";
const KNOWN_PUBLIC_PREFIX =
	"https://yneoruruvlbgffpdyiya.supabase.co/storage/v1/object/public";

/**
 * Convierte la URL que devuelve el SDK de S3 (endpoint API, no legible en
 * navegador) a URL pública del objeto. Es el mismo arreglo que Descubre aplica
 * en el cliente (`toPublicSupabaseUrl`), pero centralizado: todo lo que el
 * servidor entrega ya sale corregido.
 */
export function toPublicFileUrl(
	location: string | null | undefined,
): string {
	if (!location) return "";
	const endpoint = (process.env.AWS_ENDPOINT || "").replace(/\/+$/, "");
	if (endpoint && location.startsWith(endpoint)) {
		const marker = ".storage.supabase.co/storage/v1/s3";
		const idx = endpoint.indexOf(marker);
		if (idx !== -1) {
			return (
				endpoint.slice(0, idx) +
				".supabase.co/storage/v1/object/public" +
				location.slice(endpoint.length)
			);
		}
	}
	if (location.startsWith(KNOWN_S3_PREFIX)) {
		return KNOWN_PUBLIC_PREFIX + location.slice(KNOWN_S3_PREFIX.length);
	}
	return location;
}

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
