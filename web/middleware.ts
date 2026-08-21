import { buildPreview, toPublicSupabaseUrls } from "./src/lib/format"

const API_BASE_URL = "https://sysgd-production.up.railway.app"
const FALLBACK_IMAGE = "https://sysgd.netlify.app/og-image.png"
const SITE_NAME = "SYSGD"

const SOCIAL_BOTS =
	/(facebookexternalhit|facebot|twitterbot|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|embedly|quora link preview|vkshare|pinterestbot|applebot)/i

interface PostLike {
	id?: string
	title?: string
	description?: string
	imageUrls?: unknown
}

function escapeHtmlAttr(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function upsertMetaTag(
	html: string,
	attrType: "name" | "property",
	key: string,
	value: string,
): string {
	const content = escapeHtmlAttr(value)
	const tagPattern = new RegExp(
		`<meta\\s[^>]*${attrType}=["']${escapeRegExp(key)}["'][^>]*>`,
		"i",
	)
	const match = html.match(tagPattern)

	if (!match) {
		return html.replace(
			"</head>",
			`<meta ${attrType}="${key}" content="${content}"></head>`,
		)
	}

	let tag = match[0]
	if (/content=["']/i.test(tag)) {
		tag = tag.replace(/content=["'][^"']*["']/i, `content="${content}"`)
	} else {
		tag = tag.replace(/>$/, ` content="${content}">`)
	}
	return html.replace(tagPattern, tag)
}

function replaceTitle(html: string, value: string): string {
	if (/<title>[^]*?<\/title>/i.test(html)) {
		return html.replace(/<title>[^]*?<\/title>/i, `<title>${escapeHtmlAttr(value)}</title>`)
	}
	return html.replace("</head>", `<title>${escapeHtmlAttr(value)}</title></head>`)
}

function normalizeImages(raw: unknown): string[] {
	if (!Array.isArray(raw)) return []
	return toPublicSupabaseUrls(raw.filter((item): item is string => typeof item === "string"))
}

async function fetchPostById(id: string): Promise<PostLike | null> {
	try {
		const res = await fetch(`${API_BASE_URL}/api/descubre/posts`, {
			headers: { accept: "application/json" },
		})
		if (!res.ok) return null

		const data: unknown = await res.json()
		let posts: unknown[] = []
		if (Array.isArray(data)) {
			posts = data
		} else if (data && typeof data === "object") {
			const obj = data as Record<string, unknown>
			if (Array.isArray(obj.posts)) posts = obj.posts
			else if (Array.isArray(obj.data)) posts = obj.data
		}

		const found = posts.find(
			(item) => item && typeof item === "object" && (item as PostLike).id === id,
		)
		return (found as PostLike) ?? null
	} catch {
		return null
	}
}

export default async function middleware(request: Request): Promise<Response | undefined> {
	const userAgent = request.headers.get("user-agent") ?? ""
	const { pathname } = new URL(request.url)

	const match = pathname.match(/^\/descubre\/post\/([^/]+)$/)
	if (!match || !SOCIAL_BOTS.test(userAgent)) return undefined

	const id = decodeURIComponent(match[1])
	const post = await fetchPostById(id)

	let html: string
	try {
		const siteRes = await fetch(new URL("/index.html", request.url))
		html = await siteRes.text()
	} catch {
		return undefined
	}

	if (!post) {
		html = replaceTitle(html, `Publicación no encontrada | ${SITE_NAME}`)
		return new Response(html, {
			status: 404,
			headers: {
				"content-type": "text/html;charset=UTF-8",
				"cache-control": "public, max-age=0, s-maxage=60",
			},
		})
	}

	const title = `${post.title ?? "Publicación"} | ${SITE_NAME}`
	const description =
		buildPreview(post.description, 200) ||
		"Publicación de la comunidad SYSGD en Descubre."
	const image = normalizeImages(post.imageUrls)[0] ?? FALLBACK_IMAGE

	html = replaceTitle(html, title)
	html = upsertMetaTag(html, "property", "og:title", title)
	html = upsertMetaTag(html, "property", "og:description", description)
	html = upsertMetaTag(html, "property", "og:image", image)
	html = upsertMetaTag(html, "property", "og:url", request.url)
	html = upsertMetaTag(html, "property", "og:type", "article")
	html = upsertMetaTag(html, "name", "twitter:title", title)
	html = upsertMetaTag(html, "name", "twitter:description", description)
	html = upsertMetaTag(html, "name", "twitter:image", image)

	return new Response(html, {
		status: 200,
		headers: {
			"content-type": "text/html;charset=UTF-8",
			"cache-control": "public, max-age=0, s-maxage=300",
		},
	})
}

export const config = {
	matcher: "/descubre/post/:path*",
}
