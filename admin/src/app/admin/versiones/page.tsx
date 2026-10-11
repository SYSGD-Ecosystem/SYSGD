import { useState } from "react"
import { Rocket } from "lucide-react"

import { useAppReleases } from "../../../hooks/connection/useAppReleases"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Button } from "../../../components/ui/button"
import { Textarea } from "../../../components/ui/textarea"

const formatDate = (value: string | null) => {
	if (!value) return "Sin fecha"
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? "Sin fecha" : parsed.toLocaleString("es-CU")
}

export default function AppReleasesPage() {
	const { releases, loading, error, publishRelease } = useAppReleases()
	const [appKey, setAppKey] = useState("gctcp-android")
	const [displayName, setDisplayName] = useState("")
	const [downloadUrl, setDownloadUrl] = useState("")
	const [versionName, setVersionName] = useState("")
	const [versionCode, setVersionCode] = useState("")
	const [changelog, setChangelog] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [formOk, setFormOk] = useState<string | null>(null)

	const handlePublish = async () => {
		setFormError(null)
		setFormOk(null)
		const code = Number(versionCode)
		if (!appKey.trim() || !downloadUrl.trim() || !versionName.trim() || !Number.isInteger(code) || code <= 0) {
			setFormError("Revisa los campos: app, enlace, nombre de versión y un número de versión entero mayor que 0.")
			return
		}
		setSubmitting(true)
		try {
			await publishRelease(appKey.trim().toLowerCase(), {
				displayName: displayName.trim() || undefined,
				downloadUrl: downloadUrl.trim(),
				changelog: changelog.trim(),
				versionName: versionName.trim(),
				versionCode: code,
			})
			setFormOk("Versión publicada. La web y la app la verán al instante.")
		} catch (e: unknown) {
			setFormError(e instanceof Error ? e.message : "No se pudo publicar la versión")
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Versiones de apps</h1>
					<p className="text-muted-foreground">
						Lo publicado aquí alimenta la sección Aplicaciones de la web y el aviso de actualización en la app.
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Publicado actualmente</CardTitle>
					<CardDescription>
						El número de versión (versionCode) es lo que decide cuál es más actual.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{loading ? (
						<p className="text-sm text-muted-foreground">Cargando versiones...</p>
					) : error ? (
						<p className="text-sm text-destructive">{error}</p>
					) : releases.length === 0 ? (
						<p className="text-sm text-muted-foreground">Nada publicado todavía.</p>
					) : (
						releases.map((release) => (
							<div key={release.app_key} className="rounded-xl border p-4">
								<div className="flex items-center gap-3">
									<Rocket className="h-5 w-5 text-muted-foreground" />
									<p className="font-semibold">{release.display_name}</p>
									<p className="text-sm text-muted-foreground">
										{release.app_key} · v{release.version_name} (código {release.version_code})
									</p>
								</div>
								<div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
									<p className="break-all">Enlace: {release.download_url}</p>
									<p>Actualizada: {formatDate(release.updated_at)}</p>
								</div>
								{release.changelog && (
									<p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
										Cambios: {release.changelog}
									</p>
								)}
							</div>
						))
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Publicar / actualizar versión</CardTitle>
					<CardDescription>
						Sobrescribe lo publicado para esa app. Revisa bien el número de versión: debe ser mayor que el anterior.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<p className="text-sm font-medium">App (clave)</p>
							<Input
								value={appKey}
								onChange={(event) => setAppKey(event.target.value)}
								placeholder="gctcp-android"
							/>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium">Nombre visible</p>
							<Input
								value={displayName}
								onChange={(event) => setDisplayName(event.target.value)}
								placeholder="Gestor Contable TCP"
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<p className="text-sm font-medium">Enlace de descarga</p>
							<Input
								value={downloadUrl}
								onChange={(event) => setDownloadUrl(event.target.value)}
								placeholder="https://github.com/.../app-release.apk"
							/>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium">Nombre de versión</p>
							<Input
								value={versionName}
								onChange={(event) => setVersionName(event.target.value)}
								placeholder="1.4.0"
							/>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium">Número de versión (código)</p>
							<Input
								value={versionCode}
								onChange={(event) => setVersionCode(event.target.value)}
								placeholder="15"
								inputMode="numeric"
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<p className="text-sm font-medium">Registro de cambios</p>
							<Textarea
								value={changelog}
								onChange={(event) => setChangelog(event.target.value)}
								placeholder="Qué trae esta versión..."
								rows={4}
							/>
						</div>
					</div>
					{formError && <p className="text-sm text-destructive">{formError}</p>}
					{formOk && <p className="text-sm text-emerald-600">{formOk}</p>}
					<Button onClick={() => void handlePublish()} disabled={submitting}>
						{submitting ? "Publicando..." : "Publicar versión"}
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}
