import { useMemo } from "react"
import {
  AlertTriangle,
  Monitor,
  Smartphone,
  ShieldAlert,
  Users,
} from "lucide-react"

import { useAnomalies } from "../../../hooks/connection/useAnomalies"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import type { AnomalySeverity, MultiDeviceSignal, SharedAccountSignal } from "../../../types/anomaly"

const severityLabels: Record<AnomalySeverity, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
}

const severityVariant: Record<AnomalySeverity, "secondary" | "default" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleString("es-CU")
}

export default function SeguridadPage() {
  const { report, loading, error } = useAnomalies()

  const sharedDevices = useMemo(() => {
    if (!report) return []
    return report.sharedAccounts.filter((item) => item.type === "shared_device")
  }, [report])

  const multiIdentities = useMemo(() => {
    if (!report) return []
    return report.sharedAccounts.filter((item) => item.type === "multi_identity")
  }, [report])

  const renderMultiDeviceRow = (signal: MultiDeviceSignal) => (
    <TableRow key={`md-${signal.user_id}`}>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{signal.name || "Sin nombre"}</span>
          <span className="text-xs text-muted-foreground">{signal.email}</span>
        </div>
      </TableCell>
      <TableCell>{signal.user_agents}</TableCell>
      <TableCell>{signal.ips}</TableCell>
      <TableCell>{signal.active_sessions}</TableCell>
      <TableCell>{formatDateTime(signal.last_login)}</TableCell>
      <TableCell>
        <Badge variant={severityVariant[signal.severity]}>{severityLabels[signal.severity]}</Badge>
      </TableCell>
    </TableRow>
  )

  const renderSharedDeviceRow = (signal: SharedAccountSignal) => (
    <TableRow key={`sd-${signal.ip || signal.user_agent || signal.account_count}`}>
      <TableCell className="font-medium truncate max-w-xs">{signal.ip || "Desconocida"}</TableCell>
      <TableCell className="max-w-md truncate" title={signal.user_agent || ""}>
        {signal.user_agent || "Desconocido"}
      </TableCell>
      <TableCell>{signal.account_count}</TableCell>
      <TableCell className="max-w-sm truncate" title={signal.emails.join(", ")}>
        {signal.emails.join(", ")}
      </TableCell>
      <TableCell>{formatDateTime(signal.last_login)}</TableCell>
      <TableCell>
        <Badge variant={severityVariant[signal.severity]}>{severityLabels[signal.severity]}</Badge>
      </TableCell>
    </TableRow>
  )

  const renderMultiIdentityRow = (signal: SharedAccountSignal) => (
    <TableRow key={`mi-${signal.user_id}`}>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{signal.name || "Sin nombre"}</span>
          <span className="text-xs text-muted-foreground">{signal.emails.join(", ")}</span>
        </div>
      </TableCell>
      <TableCell>{formatDateTime(signal.last_login)}</TableCell>
      <TableCell>
        <Badge variant={severityVariant[signal.severity]}>{severityLabels[signal.severity]}</Badge>
      </TableCell>
    </TableRow>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          Seguridad
        </h1>
        <p className="text-muted-foreground">
          Señales de riesgo: mismo usuario desde distintos dispositivos y posible cuenta compartida.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando señales de riesgo...</p>
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Multi-dispositivo</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.multiDevice.length}</div>
                <p className="text-xs text-muted-foreground">
                  cuentas con ≥2 user-agents o ≥2 sesiones activas (últimos {report.windows.multiDeviceDays} días)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dispositivos compartidos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sharedDevices.length}</div>
                <p className="text-xs text-muted-foreground">mismo IP+UA usado por ≥2 cuentas (últimos {report.windows.sharedDays} días)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Múltiples identidades</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{multiIdentities.length}</div>
                <p className="text-xs text-muted-foreground">cuentas con ≥3 user-agents distintos (últimos {report.windows.sharedDays} días)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Falsos positivos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  CGNAT/Hotspots (Cuba/ETECSA) comparten IP. Usar dispositivo+último login + contexto.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Multi-dispositivo por cuenta</CardTitle>
              <CardDescription>
                Cuentas que accedieron desde distintos user-agents o tienen varias sesiones activas.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>User-agents distintos</TableHead>
                    <TableHead>IPs distintas</TableHead>
                    <TableHead>Sesiones activas</TableHead>
                    <TableHead>Último login</TableHead>
                    <TableHead>Severidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.multiDevice.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        No hay señales en esta ventana.
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.multiDevice.map(renderMultiDeviceRow)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dispositivos compartidos (mismo IP + User-Agent)</CardTitle>
              <CardDescription>Un mismo dispositivo accede a varias cuentas distintas.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead>User-Agent</TableHead>
                    <TableHead>Cuentas</TableHead>
                    <TableHead>Emails</TableHead>
                    <TableHead>Último login</TableHead>
                    <TableHead>Severidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sharedDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        No hay señales en esta ventana.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sharedDevices.map(renderSharedDeviceRow)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuentas con alta rotación de dispositivos</CardTitle>
              <CardDescription>≥3 user-agents distintos en los últimos {report.windows.sharedDays} días.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Último login</TableHead>
                    <TableHead>Severidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {multiIdentities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        No hay señales en esta ventana.
                      </TableCell>
                    </TableRow>
                  ) : (
                    multiIdentities.map(renderMultiIdentityRow)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No se pudieron cargar las señales de seguridad.</p>
      )}
    </div>
  )
}
