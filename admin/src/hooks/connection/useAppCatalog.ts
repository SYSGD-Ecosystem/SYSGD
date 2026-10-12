import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type {
	AppCategory,
	AppReview,
	ArticlePayload,
	CatalogApp,
	CatalogAppsResponse,
	PublishAppPayload,
} from "../../types/appCatalog"

export function useAppCatalog() {
	const [apps, setApps] = useState<CatalogApp[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchApps = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<CatalogAppsResponse>("/api/apps/admin/list")
			setApps(data.apps)
			setError(null)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error al obtener apps")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void fetchApps()
	}, [fetchApps])

	const saveApp = async (id: string | null, payload: PublishAppPayload) => {
		if (id) {
			await apiFetch(`/api/apps/admin/${id}`, {
				method: "PUT",
				body: JSON.stringify(payload),
			})
		} else {
			await apiFetch("/api/apps/admin", {
				method: "POST",
				body: JSON.stringify(payload),
			})
		}
		await fetchApps()
	}

	const removeApp = async (id: string) => {
		await apiFetch(`/api/apps/admin/${id}`, { method: "DELETE" })
		await fetchApps()
	}

	const fetchCategories = async (appId: string): Promise<AppCategory[]> => {
		const data = await apiFetch<{ categories: AppCategory[] }>(
			`/api/apps/admin/${appId}/categories`,
		)
		return data.categories
	}

	const createCategory = async (appId: string, name: string) => {
		await apiFetch(`/api/apps/admin/${appId}/categories`, {
			method: "POST",
			body: JSON.stringify({ name }),
		})
	}

	const removeCategory = async (categoryId: string) => {
		await apiFetch(`/api/apps/admin/categories/${categoryId}`, {
			method: "DELETE",
		})
	}

	const saveArticle = async (
		appId: string,
		articleId: string | null,
		payload: ArticlePayload,
	) => {
		if (articleId) {
			await apiFetch(`/api/apps/admin/articles/${articleId}`, {
				method: "PUT",
				body: JSON.stringify(payload),
			})
		} else {
			await apiFetch(`/api/apps/admin/${appId}/articles`, {
				method: "POST",
				body: JSON.stringify(payload),
			})
		}
	}

	const removeArticle = async (articleId: string) => {
		await apiFetch(`/api/apps/admin/articles/${articleId}`, {
			method: "DELETE",
		})
	}

	const fetchReviews = async (appSlug: string): Promise<AppReview[]> => {
		const data = await apiFetch<{ reviews: AppReview[] }>(
			`/api/apps/admin/${appSlug}/reviews`,
		)
		return data.reviews
	}

	const removeReview = async (reviewId: string) => {
		await apiFetch(`/api/apps/admin/reviews/${reviewId}`, {
			method: "DELETE",
		})
	}

	/** Sube el icono al storage y devuelve la URL pública. */
	const uploadIcon = async (file: File): Promise<string> => {
		const form = new FormData()
		form.append("file", file)
		const token = localStorage.getItem("token")
		const base = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"
		const res = await fetch(`${base}/api/uploads`, {
			method: "POST",
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: form,
		})
		if (!res.ok) throw new Error("No se pudo subir el icono")
		const data = (await res.json()) as { url?: string }
		if (!data.url) throw new Error("El servidor no devolvió URL")
		return data.url
	}

	return {
		apps,
		loading,
		error,
		refetch: fetchApps,
		saveApp,
		removeApp,
		fetchCategories,
		createCategory,
		removeCategory,
		saveArticle,
		removeArticle,
		fetchReviews,
		removeReview,
		uploadIcon,
	}
}
