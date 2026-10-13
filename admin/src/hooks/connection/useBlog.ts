import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type { BlogPost, BlogPostPayload } from "../../types/blog"

export function useBlog() {
	const [posts, setPosts] = useState<BlogPost[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchPosts = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<{ posts: BlogPost[] }>("/api/blog/admin/list")
			setPosts(data.posts)
			setError(null)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error al obtener publicaciones")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void fetchPosts()
	}, [fetchPosts])

	const savePost = async (id: string | null, payload: BlogPostPayload) => {
		if (id) {
			await apiFetch(`/api/blog/admin/${id}`, {
				method: "PUT",
				body: JSON.stringify(payload),
			})
		} else {
			await apiFetch("/api/blog/admin", {
				method: "POST",
				body: JSON.stringify(payload),
			})
		}
		await fetchPosts()
	}

	const removePost = async (id: string) => {
		await apiFetch(`/api/blog/admin/${id}`, { method: "DELETE" })
		await fetchPosts()
	}

	return { posts, loading, error, refetch: fetchPosts, savePost, removePost }
}
