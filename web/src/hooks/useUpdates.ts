import { useEffect, useState, useCallback } from "react"

import { apiFetchPublic } from "../lib/api"

type UpdateItem = {
	id: string
	date: string
	title: string
	description: string
	category: string
}

function normalizeUpdatesResponse(data: unknown): UpdateItem[] {
	if (Array.isArray(data)) return data

	if (data && typeof data === "object") {
		const obj = data as any

		// Caso directo: { updates: [...] }
		if (Array.isArray(obj.updates)) {
			return obj.updates
		}

		// Caso típico de API: { result: { updates: [...] } }
		if (obj.result && typeof obj.result === "object") {
			const result = obj.result as any
			if (Array.isArray(result.updates)) {
				return result.updates
			}
			if (Array.isArray(result.data)) {
				return result.data
			}
		}

		// Fallback genérico: { data: [...] }
		if (Array.isArray(obj.data)) {
			return obj.data
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
			console.log("Fetched updates:", data)
			setUpdates(normalizeUpdatesResponse(data))
		} catch (e: any) {
			setError(e?.message || "Error al obtener actualizaciones")
			setUpdates([])
		} finally {
			setLoading(false)
		}
	}, [])

	// Función de refetch expuesta
	const refetch = useCallback(() => {
		fetchUpdates()
	}, [fetchUpdates])

	useEffect(() => {
		let cancelled = false

		async function run() {
			try {
				const data = await apiFetchPublic<unknown>("/api/updates")
				if (!cancelled) {
					setUpdates(normalizeUpdatesResponse(data))
					setError(null)
				}
			} catch (e: any) {
				if (!cancelled) {
					setError(e?.message || "Error al obtener actualizaciones")
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

	return { updates, loading, error, refetch }
}