import { useEffect, useState, useCallback } from "react"

import { apiFetchPublic } from "../lib/api"

type UpdateItem = {
	id: string
	date: string
	title: string
	description: string
	category: string
}

export default function useUpdates() {
	const [updates, setUpdates] = useState<UpdateItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchUpdates = useCallback(async () => {
		setLoading(true)
		setError(null)
		
		try {
			const data = await apiFetchPublic<UpdateItem[]>("/api/updates")
			setUpdates(data)
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
				const data = await apiFetchPublic<UpdateItem[]>("/api/updates")
				if (!cancelled) {
					setUpdates(data)
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