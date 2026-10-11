import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type { ApklisClaimOrder, ApklisClaimOrdersResponse } from "../../types/apklisClaim"

type ReviewPayload = {
	status: "approved" | "rejected"
	reviewNotes?: string
}

export function useApklisClaims() {
	const [orders, setOrders] = useState<ApklisClaimOrder[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchOrders = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<ApklisClaimOrdersResponse>("/api/apklis-claims/admin/orders")
			setOrders(data.orders)
			setError(null)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error al obtener reclamos Apklis")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void fetchOrders()
	}, [fetchOrders])

	const reviewOrder = async (id: string, payload: ReviewPayload) => {
		await apiFetch<{ order: ApklisClaimOrder }>(`/api/apklis-claims/admin/orders/${id}/review`, {
			method: "PUT",
			body: JSON.stringify(payload),
		})
		await fetchOrders()
	}

	return {
		orders,
		loading,
		error,
		refetch: fetchOrders,
		reviewOrder,
	}
}
