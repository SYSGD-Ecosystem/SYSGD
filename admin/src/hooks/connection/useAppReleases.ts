import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type {
	AppRelease,
	AppReleasesResponse,
	PublishAppReleasePayload,
} from "../../types/appRelease"

export function useAppReleases() {
	const [releases, setReleases] = useState<AppRelease[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchReleases = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<AppReleasesResponse>("/api/app-releases")
			setReleases(data.releases)
			setError(null)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error al obtener versiones")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void fetchReleases()
	}, [fetchReleases])

	const publishRelease = async (appKey: string, payload: PublishAppReleasePayload) => {
		await apiFetch<{ release: AppRelease }>(`/api/app-releases/${appKey}`, {
			method: "PUT",
			body: JSON.stringify(payload),
		})
		await fetchReleases()
	}

	return {
		releases,
		loading,
		error,
		refetch: fetchReleases,
		publishRelease,
	}
}
