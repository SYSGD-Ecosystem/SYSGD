import { useCallback, useEffect, useState } from "react"

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"

export interface OrgNode {
  name: string
  title?: string
  department?: string
  children?: OrgNode[]
}

interface UseOrgReturn {
  data: OrgNode | null
  loading: boolean
  error: string | null
  save: (tree: OrgNode) => Promise<void>
  refetch: () => void
}

export function useOrganizationChart(fileId: string): UseOrgReturn {
  const [data, setData] = useState<OrgNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChart = useCallback(() => {
    if (!fileId) return
    setLoading(true)
    fetch(`${serverUrl}/api/organization?id=${encodeURIComponent(fileId)}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Error al obtener organigrama")
        const json = await res.json()
        setData(json)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fileId])

  useEffect(() => {
    fetchChart()
  }, [fetchChart])

  const save = async (tree: OrgNode) => {
    const res = await fetch(`${serverUrl}/api/organization`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: fileId, data: tree }),
    })
    if (!res.ok) throw new Error(await res.text())
    setData(tree)
  }

  return { data, loading, error, save, refetch: fetchChart }
}
