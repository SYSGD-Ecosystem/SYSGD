import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { MarkdownContent } from "@/components/markdown-content"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { LoginDialog } from "@/components/login-dialog"
import { useAuth } from "@/hooks/useAuth"
import { useSeo } from "@/hooks/useSeo"
import { toPublicSupabaseUrl } from "@/lib/format"
import { useCatalogAppDetail } from "@/hooks/useAppCatalog"
import { ArrowLeft, Download, Star } from "lucide-react"

function Stars({ value, onPick }: { value: number; onPick?: (v: number) => void }) {
	return (
		<div className="flex gap-1">
			{[1, 2, 3, 4, 5].map((v) => (
				<button
					key={v}
					type="button"
					disabled={!onPick}
					onClick={() => onPick?.(v)}
					className={onPick ? "cursor-pointer" : "cursor-default"}
					aria-label={`${v} estrellas`}
				>
					<Star
						className={`h-5 w-5 ${v <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
					/>
				</button>
			))}
		</div>
	)
}

export default function AppDetailPage() {
	const { slug } = useParams<{ slug: string }>()
	const { user } = useAuth()
	const { app, articles, reviews, loading, error, submitReview } = useCatalogAppDetail(slug)
	const [loginOpen, setLoginOpen] = useState(false)
	const [rating, setRating] = useState(5)
	const [comment, setComment] = useState("")
	const [sending, setSending] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

	const categories = useMemo(() => {
		const map = new Map<string, string>()
		for (const a of articles) {
			if (a.category_slug) map.set(a.category_slug, a.category_name ?? a.category_slug)
		}
		return [...map.entries()]
	}, [articles])

	const visibleArticles = useMemo(
		() => (categoryFilter ? articles.filter((a) => a.category_slug === categoryFilter) : articles),
		[articles, categoryFilter],
	)

	useSeo({
		title: app ? `${app.name} | SYSGD Apps` : "App | SYSGD",
		description: app?.tagline || app?.description?.slice(0, 200) || "Aplicación de SYSGD Ecosystem.",
		image: toPublicSupabaseUrl(app?.icon_url) || "https://sysgd.netlify.app/og-image.png",
		url: app ? `https://sysgd.netlify.app/apps/${app.slug}` : undefined,
		type: "website",
	})

	if (loading) {
		return (
			<div className="py-24 text-center text-muted-foreground">Cargando aplicación...</div>
		)
	}

	if (error || !app) {
		return (
			<div className="py-24 text-center">
				<p className="text-muted-foreground">No se encontró esta aplicación.</p>
				<Button asChild variant="outline" className="mt-4">
					<Link to="/apps">Volver a Aplicaciones</Link>
				</Button>
			</div>
		)
	}

	const downloadUrl = app.release_download_url || app.download_url

	const handleReview = async () => {
		if (!user) {
			setLoginOpen(true)
			return
		}
		setSending(true)
		setFormError(null)
		try {
			await submitReview(rating, comment.trim())
			setComment("")
		} catch (e: unknown) {
			setFormError(e instanceof Error ? e.message : "No se pudo enviar tu opinión")
		} finally {
			setSending(false)
		}
	}

	return (
		<div className="py-12 md:py-16">
			<div className="container mx-auto px-4 md:px-6 max-w-4xl">
				<Button asChild variant="ghost" size="sm" className="mb-6">
					<Link to="/apps">
						<ArrowLeft className="mr-2 h-4 w-4" /> Aplicaciones
					</Link>
				</Button>

				{/* Hero */}
				<div className="flex flex-col sm:flex-row gap-6 items-start">
					{toPublicSupabaseUrl(app.icon_url) ? (
						<img src={toPublicSupabaseUrl(app.icon_url)} alt={app.name} className="h-24 w-24 rounded-2xl object-cover shrink-0" />
					) : (
						<div className="h-24 w-24 rounded-2xl bg-muted shrink-0" />
					)}
					<div className="flex-1 min-w-0">
						<h1 className="text-3xl md:text-4xl font-bold">{app.name}</h1>
						{app.tagline && (
							<p className="mt-1 text-lg text-muted-foreground">{app.tagline}</p>
						)}
						<div className="mt-3 flex flex-wrap items-center gap-2">
							{app.price_label && <Badge>{app.price_label}</Badge>}
							{app.platforms.map((p) => (
								<Badge key={p} variant="outline">{p}</Badge>
							))}
							<span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
								<Star className="h-4 w-4 fill-amber-400 text-amber-400" />
								{Number(app.rating_avg).toFixed(1)} ({app.rating_count} opiniones)
							</span>
						</div>
					</div>
				</div>

				{/* Descarga */}
				{downloadUrl && (
					<Card className="mt-6 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
						<div className="flex-1">
							<p className="font-semibold">
								{app.release_version_name
									? `Versión ${app.release_version_name}`
									: "Descarga disponible"}
							</p>
							{app.release_changelog && (
								<p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
									{app.release_changelog}
								</p>
							)}
						</div>
						<Button asChild size="lg" className="rounded-full shrink-0">
							<a href={downloadUrl} target="_blank" rel="noopener noreferrer">
								<Download className="mr-2 h-4 w-4" /> Instalar
							</a>
						</Button>
					</Card>
				)}

				{/* Descripción */}
				{app.description && (
					<div className="mt-8">
						<MarkdownContent text={app.description} />
					</div>
				)}

				{/* Artículos */}
				{articles.length > 0 && (
					<div className="mt-12">
						<h2 className="text-2xl font-bold mb-4">Artículos</h2>
						{categories.length > 0 && (
							<div className="flex flex-wrap gap-2 mb-4">
								<Button
									size="sm"
									variant={categoryFilter === null ? "default" : "outline"}
									onClick={() => setCategoryFilter(null)}
								>
									Todos
								</Button>
								{categories.map(([cslug, cname]) => (
									<Button
										key={cslug}
										size="sm"
										variant={categoryFilter === cslug ? "default" : "outline"}
										onClick={() => setCategoryFilter(cslug)}
									>
										{cname}
									</Button>
								))}
							</div>
						)}
						<div className="grid gap-4 md:grid-cols-2">
							{visibleArticles.map((a) => (
								<Link key={a.id} to={`/apps/${app.slug}/articulos/${a.slug}`}>
									<Card className="p-4 h-full hover:border-primary transition-colors">
										<p className="font-semibold">{a.title}</p>
										<p className="text-sm text-muted-foreground mt-1">
											{a.category_name ?? "General"} · {new Date(a.created_at).toLocaleDateString()}
										</p>
									</Card>
								</Link>
							))}
						</div>
						{visibleArticles.length === 0 && (
							<p className="text-sm text-muted-foreground">Sin artículos en esta categoría.</p>
						)}
					</div>
				)}

				{/* Opiniones */}
				<div className="mt-12">
					<h2 className="text-2xl font-bold mb-4">Opiniones</h2>
					<Card className="p-5 mb-6">
						<p className="font-medium mb-2">Tu valoración</p>
						<Stars value={rating} onPick={setRating} />
						<Textarea
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="Cuéntanos qué te parece esta app..."
							rows={3}
							className="mt-3"
						/>
						{formError && <p className="text-sm text-destructive mt-2">{formError}</p>}
						<Button onClick={() => void handleReview()} disabled={sending} className="mt-3">
							{sending ? "Enviando..." : user ? "Publicar opinión" : "Inicia sesión para opinar"}
						</Button>
					</Card>
					<div className="space-y-4">
						{reviews.length === 0 ? (
							<p className="text-sm text-muted-foreground">Aún no hay opiniones. Sé el primero.</p>
						) : (
							reviews.map((r) => (
								<Card key={r.id} className="p-4">
									<div className="flex items-center justify-between gap-2">
										<p className="font-medium">{r.user_name}</p>
										<Stars value={r.rating} />
									</div>
									{r.comment && (
										<p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{r.comment}</p>
									)}
									<p className="text-xs text-muted-foreground mt-2">
										{new Date(r.created_at).toLocaleDateString()}
									</p>
								</Card>
							))
						)}
					</div>
				</div>

				<LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
			</div>
		</div>
	)
}
