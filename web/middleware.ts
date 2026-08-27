import { buildPreview, stripMarkdown, toPublicSupabaseUrls } from "./src/lib/format"

const API_BASE_URL = "https://sysgd-production.up.railway.app"
const SITE_NAME = "SYSGD"
const FALLBACK_IMAGE = "https://sysgd.netlify.app/og-image.png"

const SOCIAL_BOTS =
	/(facebookexternalhit|facebot|twitterbot|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|embedly|quora link preview|vkshare|pinterestbot|applebot)/i

interface ResourceLike {
	id?: string
	title?: string
	description?: string
	images?: unknown
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

type ResourceKind = "descubre" | "updates"

/** Busca el recurso por id en la API pública del proyecto. */
async function fetchResourceById(kind: ResourceKind, id: string): Promise<ResourceLike | null> {
	const endpoint =
		kind === "descubre" ? "/api/descubre/posts" : "/api/updates"
	const imageField = kind === "descubre" ? "imageUrls" : "screenshots"

	try {
		const res = await fetch(`${API_BASE_URL}${endpoint}`, {
			headers: { accept: "application/json" },
		})
		if (!res.ok) return null

		const data: unknown = await res.json()
		let items: unknown[] = []
		if (Array.isArray(data)) {
			items = data
		} else if (data && typeof data === "object") {
			const obj = data as Record<string, unknown>
			if (Array.isArray(obj.posts)) items = obj.posts
			else if (Array.isArray(obj.updates)) items = obj.updates
			else if (Array.isArray(obj.data)) items = obj.data
		}

		const found = items.find(
			(item) => item && typeof item === "object" && (item as ResourceLike).id === id,
		)
		if (!found || typeof found !== "object") return null

		const item = found as ResourceLike
		// updates usan `screenshots`; descubre `imageUrls`. Homogeneizamos como `images`.
		const images = Array.isArray((item as Record<string, unknown>)[imageField])
			? ((item as Record<string, unknown>)[imageField] as unknown[])
			: undefined
		return { ...item, images: images ?? item.images }
	} catch {
		return null
	}
}

export default async function middleware(request: Request): Promise<Response | undefined> {
	const userAgent = request.headers.get("user-agent") ?? ""
	const { pathname } = new URL(request.url)

	const match = pathname.match(/^\/(descubre\/post|updates)\/([^/]+)$/)
	if (!match || !SOCIAL_BOTS.test(userAgent)) return undefined

	const kind: ResourceKind = match[1] === "updates" ? "updates" : "descubre"
	const id = decodeURIComponent(match[2])
	const resource = await fetchResourceById(kind, id)

	let html: string
	try {
		const siteRes = await fetch(new URL("/index.html", request.url))
		html = await siteRes.text()
	} catch {
		return undefined
	}

	if (!resource) {
		html = replaceTitle(html, `Publicación no encontrada | ${SITE_NAME}`)
		return new Response(html, {
			status: 404,
			headers: {
				"content-type": "text/html;charset=UTF-8",
				"cache-control": "public, max-age=0, s-maxage=60",
			},
		})
	}

	const title = `${resource.title ?? "Publicación"} | ${SITE_NAME}`
	const description =
		buildPreview(stripMarkdown(resource.description), 200) ||
		"Novedad de la comunidad SYSGD."
	const image = normalizeImages(resource.images)[0] ?? FALLBACK_IMAGE

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
	matcher: ["/descubre/post/:path*", "/updates/:path*"],
}