import { useCallback, useEffect, useState } from "react"

import { apiFetch } from "../../lib/api"

export interface GeneralMetrics {
  totalUsers: number
  totalProjects: number
  totalTasks: number
  totalRegistrosContables: number
}

export interface UsuarioContabilidad {
  userId: string
  nombre: string
  email: string
  tieneRegistro: boolean
  creditos: number
  ultimoUpdate: string | null
}

export interface ContabilidadMetrics {
  usuariosActivos: number
  totalRegistros: number
  usuarios: UsuarioContabilidad[]
}

export interface UsuarioProyectos {
  userId: string
  nombre: string
  email: string
  proyectosCount: number
  tareasCount: number
  creditos: number
}

export interface ProyectosMetrics {
  usuarios: UsuarioProyectos[]
}

export interface AdminMetrics {
  general: GeneralMetrics
  contabilidad: ContabilidadMetrics
  proyectos: ProyectosMetrics
}

type UseAdminMetricsReturn = {
	metrics: AdminMetrics | null
	loading: boolean
	error: string | null
	refetch: () => void
}

export function useAdminMetrics(): UseAdminMetricsReturn {
	const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchMetrics = useCallback(async () => {
		setLoading(true)
		try {
			const data = await apiFetch<AdminMetrics>("/api/admin/metrics")
			setMetrics(data)
			setError(null)
		} catch (e: any) {
			setError(e?.message || "Error al obtener métricas")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchMetrics()
	}, [fetchMetrics])

	return {
		metrics,
		loading,
		error,
		refetch: fetchMetrics,
	}
}
