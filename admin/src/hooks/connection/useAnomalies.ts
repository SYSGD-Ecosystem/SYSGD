import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"
import type { AnomalyReport } from "../../types/anomaly"

type UseAnomaliesReturn = {
	report: AnomalyReport | null
	loading: boolean
	error: string | null
	refetch: () => void
}

export function useAnomalies(): UseAnomaliesReturn {
	const [report, setReport] = useState<AnomalyReport | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchAnomalies = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<AnomalyReport>("/api/admin/anomalies")
			setReport(data)
			setError(null)
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Error al obtener señales de riesgo"
			setError(message)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void fetchAnomalies()
	}, [fetchAnomalies])

	return { report, loading, error, refetch: fetchAnomalies }
}
