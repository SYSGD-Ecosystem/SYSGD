import { useEffect, useState } from "react"

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

	useEffect(() => {
		let cancelled = false

		async function run() {
			setLoading(true)
			try {
				const data = await apiFetchPublic<UpdateItem[]>("/api/updates")
				if (!cancelled) {
					setUpdates(data)
					setError(null)
				}
			} catch (e: any) {
				if (!cancelled) setError(e?.message || "Error al obtener updates")
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		run()
		return () => {
			cancelled = true
		}
	}, [])

	return { updates, loading, error }
}
