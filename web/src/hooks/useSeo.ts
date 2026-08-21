import { useEffect } from "react"

export interface SeoData {
	title?: string
	description?: string
	image?: string
	url?: string
	type?: string
}

const MANAGED_KEYS: Array<["name" | "property", string]> = [
	["name", "description"],
	["property", "og:title"],
	["property", "og:description"],
	["property", "og:image"],
	["property", "og:url"],
	["property", "og:type"],
	["name", "twitter:title"],
	["name", "twitter:description"],
	["name", "twitter:image"],
]

function getMeta(attr: "name" | "property", key: string): HTMLMetaElement | null {
	return document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
}

function setMeta(attr: "name" | "property", key: string, content: string) {
	let el = getMeta(attr, key)
	if (!el) {
		el = document.createElement("meta")
		el.setAttribute(attr, key)
		document.head.appendChild(el)
	}
	el.setAttribute("content", content)
}

export function useSeo(data: SeoData) {
	const { title, description, image, url, type } = data

	useEffect(() => {
		const previousTitle = document.title
		const snapshots = MANAGED_KEYS.map(([attr, key]) => {
			const el = getMeta(attr, key)
			return { el, value: el?.getAttribute("content") ?? null }
		})

		if (title) {
			document.title = title
			setMeta("property", "og:title", title)
			setMeta("name", "twitter:title", title)
		}

		if (description) {
			setMeta("name", "description", description)
			setMeta("property", "og:description", description)
			setMeta("name", "twitter:description", description)
		}

		if (image) {
			setMeta("property", "og:image", image)
			setMeta("name", "twitter:image", image)
		}

		if (url) {
			setMeta("property", "og:url", url)
		}

		if (type) {
			setMeta("property", "og:type", type)
		}

		return () => {
			document.title = previousTitle
			for (const { el, value } of snapshots) {
				if (!el) continue
				if (value === null) {
					el.removeAttribute("content")
				} else {
					el.setAttribute("content", value)
				}
			}
		}
	}, [title, description, image, url, type])
}
