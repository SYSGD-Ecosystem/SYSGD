import { useEffect, useState } from "react"

import { apiFetchPublic } from "@/lib/api"

export interface BlogPost {
	id: string
	slug: string
	title: string
	category: string
	cover_url: string
	body: string
	is_published: boolean
	created_at: string
	updated_at: string
}

export function useBlogPosts() {
	const [posts, setPosts] = useState<BlogPost[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let alive = true
		apiFetchPublic<{ posts: BlogPost[] }>("/api/blog")
			.then((data) => {
				if (alive) setPosts(data.posts ?? [])
			})
			.catch(() => {
				if (alive) setPosts([])
			})
			.finally(() => {
				if (alive) setLoading(false)
			})
		return () => {
			alive = false
		}
	}, [])

	return { posts, loading }
}

export function useBlogPost(slug: string | undefined) {
	const [post, setPost] = useState<BlogPost | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!slug) {
			setLoading(false)
			return
		}
		let alive = true
		setLoading(true)
		apiFetchPublic<{ post: BlogPost }>(`/api/blog/${slug}`)
			.then((data) => {
				if (alive) {
					setPost(data.post)
					setError(null)
				}
			})
			.catch((e: unknown) => {
				if (alive) setError(e instanceof Error ? e.message : "No se pudo cargar")
			})
			.finally(() => {
				if (alive) setLoading(false)
			})
		return () => {
			alive = false
		}
	}, [slug])

	return { post, loading, error }
}
