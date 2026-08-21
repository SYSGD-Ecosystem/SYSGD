const SUPABASE_S3_PREFIX =
	"https://yneoruruvlbgffpdyiya.storage.supabase.co/storage/v1/s3"
const SUPABASE_PUBLIC_PREFIX =
	"https://yneoruruvlbgffpdyiya.supabase.co/storage/v1/object/public"

export function toPublicSupabaseUrl(url: string | null | undefined): string {
	if (!url) return ""
	return url.replace(SUPABASE_S3_PREFIX, SUPABASE_PUBLIC_PREFIX)
}
