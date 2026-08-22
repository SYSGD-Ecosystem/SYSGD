import { useEffect, useState, useCallback } from "react"

import { apiFetchPublic } from "../lib/api"

export type DescubrePost = {
	id: string
	userId: string
	userName: string
	contactNumber: string
	moneda: string
	province: string
	precio: string
	date: string
	title: string
	description: string
	category: string
	imageUrls: string[]
	votesCount?: number
	viewerVoted?: boolean
}

export type DescubrePostInput = {
	title: string
	description: string
	category?: string
	precio?: string
	moneda?: string
	province?: string
	contactNumber: string
	imageUrls?: string[]
}

function normalizePostsResponse(data: unknown): DescubrePost[] {
	if (Array.isArray(data)) return data

	if (data && typeof data === "object") {
		const obj = data as Record<string, unknown>

		if (Array.isArray(obj.posts)) return obj.posts as DescubrePost[]

		if (obj.result && typeof obj.result === "object") {
			const result = obj.result as Record<string, unknown>
			if (Array.isArray(result.posts)) return result.posts as DescubrePost[]
			if (Array.isArray(result.data)) return result.data as DescubrePost[]
		}

		if (Array.isArray(obj.data)) return obj.data as DescubrePost[]
	}

	return []
}

export default function useDescubrePosts() {
	const [posts, setPosts] = useState<DescubrePost[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchPosts = useCallback(async () => {
		setLoading(true)
		setError(null)

		try {
			const data = await apiFetchPublic<unknown>("/api/descubre/posts")
			setPosts(normalizePostsResponse(data))
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Error al obtener publicaciones"
			setError(message)
			setPosts([])
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchPosts()
	}, [fetchPosts])

	/**
	 * Vota o quita el voto del usuario en una publicación.
	 * Devuelve el nuevo estado; null si falló.
	 */
	const votePost = useCallback(
		async (postId: string): Promise<{ voted: boolean; votesCount: number } | null> => {
			try {
				const data = await apiFetchPublic<{ voted: boolean; votesCount: number }>(
					`/api/descubre/posts/${postId}/vote`,
					{ method: "POST" },
				)
				setPosts((prev) =>
					prev.map((p) =>
						p.id === postId ? { ...p, viewerVoted: data.voted, votesCount: data.votesCount } : p,
					),
				)
				return data
			} catch (e: unknown) {
				console.error("Error al votar:", e)
				return null
			}
		},
		[],
	)

	/** Edita una publicación propia. Devuelve el post actualizado o null si falló. */
	const updatePost = useCallback(
		async (postId: string, input: DescubrePostInput): Promise<DescubrePost | null> => {
			try {
				const data = await apiFetchPublic<{ post: DescubrePost }>(
					`/api/descubre/posts/${postId}`,
					{ method: "PUT", body: JSON.stringify(input) },
				)
				const updated = data?.post
				if (!updated) return null
				setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...updated } : p)))
				return updated
			} catch (e: unknown) {
				console.error("Error al actualizar:", e)
				return null
			}
		},
		[],
	)

	/** Elimina una publicación propia. Devuelve true si se eliminó. */
	const deletePost = useCallback(async (postId: string): Promise<boolean> => {
		try {
			await apiFetchPublic(`/api/descubre/posts/${postId}`, { method: "DELETE" })
			setPosts((prev) => prev.filter((p) => p.id !== postId))
			return true
		} catch (e: unknown) {
			console.error("Error al eliminar:", e)
			return false
		}
	}, [])

	return { posts, loading, error, refetch: fetchPosts, votePost, updatePost, deletePost }
}
