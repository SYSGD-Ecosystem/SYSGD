import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type { MonthlyRevenue } from "../../types/revenue"

type UseRevenueReturn = {
	revenue: MonthlyRevenue | null
	loading: boolean
	error: string | null
	refetch: () => void
}

export function useRevenue(months: number = 12): UseRevenueReturn {
	const [revenue, setRevenue] = useState<MonthlyRevenue | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchRevenue = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<MonthlyRevenue>(
				`/api/admin/revenue/monthly?months=${months}`,
			)
			setRevenue(data)
			setError(null)
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Error al obtener ingresos"
			setError(message)
		} finally {
			setLoading(false)
		}
	}, [months])

	useEffect(() => {
		void fetchRevenue()
	}, [fetchRevenue])

	return { revenue, loading, error, refetch: fetchRevenue }
}
