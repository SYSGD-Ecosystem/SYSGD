import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type { CreateUpdateData, UpdateItem, UpdateUpdateData } from "../../types/update"

type UseUpdatesReturn = {
	updates: UpdateItem[]
	loading: boolean
	error: string | null
	refetch: () => void
	createUpdate: (data: CreateUpdateData) => Promise<UpdateItem>
	updateUpdate: (id: string, data: UpdateUpdateData) => Promise<UpdateItem>
	deleteUpdate: (id: string) => Promise<void>
}

export function useUpdates(): UseUpdatesReturn {
	const [updates, setUpdates] = useState<UpdateItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchUpdates = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<UpdateItem[]>("/api/updates")
			setUpdates(data)
			setError(null)
		} catch (e: any) {
			setError(e?.message || "Error al obtener updates")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchUpdates()
	}, [fetchUpdates])

	const createUpdate = async (data: CreateUpdateData) => {
		const created = await apiFetch<UpdateItem>("/api/updates", {
			method: "POST",
			body: JSON.stringify(data),
		})
		await fetchUpdates()
		return created
	}

	const updateUpdate = async (id: string, data: UpdateUpdateData) => {
		const updated = await apiFetch<UpdateItem>(`/api/updates/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		})
		await fetchUpdates()
		return updated
	}

	const deleteUpdate = async (id: string) => {
		await apiFetch<void>(`/api/updates/${id}`, { method: "DELETE" })
		setUpdates((prev) => prev.filter((u) => u.id !== id))
	}

	return {
		updates,
		loading,
		error,
		refetch: fetchUpdates,
		createUpdate,
		updateUpdate,
		deleteUpdate,
	}
}
