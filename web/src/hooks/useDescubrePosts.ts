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

	const refetch = useCallback(() => {
		fetchPosts()
	}, [fetchPosts])

	useEffect(() => {
		let cancelled = false

		async function run() {
			try {
				const data = await apiFetchPublic<unknown>("/api/descubre/posts")
				if (!cancelled) {
					setPosts(normalizePostsResponse(data))
					setError(null)
				}
			} catch (e: unknown) {
				if (!cancelled) {
					const message = e instanceof Error ? e.message : "Error al obtener publicaciones"
					setError(message)
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
				}
			}
		}

		run()

		return () => {
			cancelled = true
		}
	}, [])

	return { posts, loading, error, refetch }
}
