import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type { ManualPaymentOrder, ManualPaymentOrdersResponse } from "../../types/manualPayment"

type ReviewPayload = {
	status: "approved" | "rejected"
	reviewNotes?: string
}

export function useManualPayments() {
	const [orders, setOrders] = useState<ManualPaymentOrder[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchOrders = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<ManualPaymentOrdersResponse>("/api/manual-payments/admin/orders")
			setOrders(data.orders)
			setError(null)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error al obtener compras manuales")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void fetchOrders()
	}, [fetchOrders])

	const reviewOrder = async (id: string, payload: ReviewPayload) => {
		await apiFetch<{ order: ManualPaymentOrder }>(`/api/manual-payments/admin/orders/${id}/review`, {
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
