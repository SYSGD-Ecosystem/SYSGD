import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type { DescubrePostAdmin } from "../../types/descubrePost"

type UseDescubrePostsAdminReturn = {
	posts: DescubrePostAdmin[]
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
	deletePost: (id: string) => Promise<void>
}

export function useDescubrePostsAdmin(): UseDescubrePostsAdminReturn {
	const [posts, setPosts] = useState<DescubrePostAdmin[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchPosts = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<DescubrePostAdmin[]>("/api/descubre/admin/posts")
			setPosts(Array.isArray(data) ? data : [])
			setError(null)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error al obtener las publicaciones")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchPosts()
	}, [fetchPosts])

	const deletePost = async (id: string) => {
		await apiFetch<{ message: string }>(`/api/descubre/admin/posts/${id}`, {
			method: "DELETE",
		})
		setPosts((prev) => prev.filter((p) => p.id !== id))
	}

	return {
		posts,
		loading,
		error,
		refetch: fetchPosts,
		deletePost,
	}
}
