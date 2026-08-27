import { useEffect, useState, useCallback } from "react"

import { apiFetchPublic } from "../lib/api"

export type UpdateItem = {
	id: string
	date: string
	title: string
	description: string
	category: string
	youtube_url?: string | null
	screenshots?: string[]
}

function isUpdateItem(obj: unknown): obj is UpdateItem {
	if (!obj || typeof obj !== "object") return false
	const item = obj as Record<string, unknown>
	return typeof item.id === "string" && typeof item.title === "string"
}

function normalizeUpdatesResponse(data: unknown): UpdateItem[] {
	if (Array.isArray(data)) {
		return data.filter(isUpdateItem)
	}

	if (data && typeof data === "object") {
		const obj = data as Record<string, unknown>

		// Caso directo: { updates: [...] }
		if (Array.isArray(obj.updates)) {
			return obj.updates.filter(isUpdateItem)
		}

		// Caso típico de API: { result: { updates: [...] } }
		if (obj.result && typeof obj.result === "object") {
			const result = obj.result as Record<string, unknown>
			if (Array.isArray(result.updates)) {
				return result.updates.filter(isUpdateItem)
			}
			if (Array.isArray(result.data)) {
				return result.data.filter(isUpdateItem)
			}
		}

		// Fallback genérico: { data: [...] }
		if (Array.isArray(obj.data)) {
			return obj.data.filter(isUpdateItem)
		}
	}

	return []
}

export default function useUpdates() {
	const [updates, setUpdates] = useState<UpdateItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchUpdates = useCallback(async () => {
		setLoading(true)
		setError(null)

		try {
			const data = await apiFetchPublic<unknown>("/api/updates")
			setUpdates(normalizeUpdatesResponse(data))
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error al obtener actualizaciones")
			setUpdates([])
		} finally {
			setLoading(false)
		}
	}, [])

	const refetch = useCallback(() => {
		fetchUpdates()
	}, [fetchUpdates])

	useEffect(() => {
		fetchUpdates()
	}, [fetchUpdates])

	return { updates, loading, error, refetch }
}
