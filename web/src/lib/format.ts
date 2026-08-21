const SUPABASE_S3_PREFIX =
	"https://yneoruruvlbgffpdyiya.storage.supabase.co/storage/v1/s3"
const SUPABASE_PUBLIC_PREFIX =
	"https://yneoruruvlbgffpdyiya.supabase.co/storage/v1/object/public"

export function toPublicSupabaseUrl(url: string | null | undefined): string {
	if (!url) return ""
	return url.replace(SUPABASE_S3_PREFIX, SUPABASE_PUBLIC_PREFIX)
}

export function toPublicSupabaseUrls(urls: string[] | null | undefined): string[] {
	if (!Array.isArray(urls)) return []
	return urls
		.filter((url) => typeof url === "string" && url.length > 0)
		.map(toPublicSupabaseUrl)
}

const MARKDOWN_PATTERNS: Array<[RegExp, string]> = [
	[/^#{1,6}\s+/gm, ""],
	[/!\[([^\]]*)\]\([^)]*\)/g, "$1"],
	[/\[([^\]]+)\]\([^)]*\)/g, "$1"],
	[/(\*\*|__)(.*?)\1/g, "$2"],
	[/(\*|_)(.*?)\1/g, "$2"],
	[/~~(.*?)~~/g, "$1"],
	[/`{1,3}([^`]*)`{1,3}/g, "$1"],
	[/^\s*([-*+]|\d+\.)\s+/gm, ""],
	[/^\s*>\s?/gm, ""],
	[/\r?\n+/g, " "],
]

export function stripMarkdown(text: string | null | undefined): string {
	if (!text) return ""
	let plain = text
	for (const [pattern, replacement] of MARKDOWN_PATTERNS) {
		plain = plain.replace(pattern, replacement)
	}
	return plain.replace(/\s+/g, " ").trim()
}

export function buildPreview(text: string | null | undefined, maxLength = 180): string {
	const plain = stripMarkdown(text)
	if (plain.length <= maxLength) return plain

	const cut = plain.slice(0, maxLength)
	const lastSpace = cut.lastIndexOf(" ")
	const trimmed = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut
	return `${trimmed.trimEnd()}…`
}
