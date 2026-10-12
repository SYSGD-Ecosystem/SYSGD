import { useCallback, useEffect, useState } from "react"

import { apiFetchPublic } from "@/lib/api"
import type { CatalogApp, CatalogArticle, CatalogReview } from "@/types/appCatalog"

export function useCatalogApps() {
	const [apps, setApps] = useState<CatalogApp[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let alive = true
		apiFetchPublic<{ apps: CatalogApp[] }>("/api/apps")
			.then((data) => {
				if (alive) setApps(data.apps ?? [])
			})
			.catch(() => {
				if (alive) setApps([])
			})
			.finally(() => {
				if (alive) setLoading(false)
			})
		return () => {
			alive = false
		}
	}, [])

	return { apps, loading }
}

export function useCatalogAppDetail(slug: string | undefined) {
	const [app, setApp] = useState<CatalogApp | null>(null)
	const [articles, setArticles] = useState<CatalogArticle[]>([])
	const [reviews, setReviews] = useState<CatalogReview[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchAll = useCallback(async () => {
		if (!slug) return
		setLoading(true)
		try {
			const [appRes, artRes, revRes] = await Promise.all([
				apiFetchPublic<{ app: CatalogApp }>(`/api/apps/${slug}`),
				apiFetchPublic<{ articles: CatalogArticle[] }>(`/api/apps/${slug}/articles`),
				apiFetchPublic<{ reviews: CatalogReview[] }>(`/api/apps/${slug}/reviews`),
			])
			setApp(appRes.app)
			setArticles(artRes.articles ?? [])
			setReviews(revRes.reviews ?? [])
			setError(null)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "No se pudo cargar la app")
		} finally {
			setLoading(false)
		}
	}, [slug])

	useEffect(() => {
		void fetchAll()
	}, [fetchAll])

	const submitReview = async (rating: number, comment: string) => {
		if (!slug) return
		await apiFetchPublic(`/api/apps/${slug}/reviews`, {
			method: "POST",
			body: JSON.stringify({ rating, comment }),
		})
		await fetchAll()
	}

	return { app, articles, reviews, loading, error, refetch: fetchAll, submitReview }
}

export function useCatalogArticle(appSlug: string | undefined, articleSlug: string | undefined) {
	const [article, setArticle] = useState<CatalogArticle | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!appSlug || !articleSlug) {
			setLoading(false)
			return
		}
		let alive = true
		setLoading(true)
		apiFetchPublic<{ article: CatalogArticle }>(`/api/apps/${appSlug}/articles/${articleSlug}`)
			.then((data) => {
				if (alive) {
					setArticle(data.article)
					setError(null)
				}
			})
			.catch((e: unknown) => {
				if (alive) setError(e instanceof Error ? e.message : "No se pudo cargar el artículo")
			})
			.finally(() => {
				if (alive) setLoading(false)
			})
		return () => {
			alive = false
		}
	}, [appSlug, articleSlug])

	return { article, loading, error }
}
