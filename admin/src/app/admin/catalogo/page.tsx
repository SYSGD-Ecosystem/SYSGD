import { useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Star, Trash2, Upload } from "lucide-react"

import { useAppCatalog } from "../../../hooks/connection/useAppCatalog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Textarea } from "../../../components/ui/textarea"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select"
import type {
	AppArticle,
	AppCategory,
	AppReview,
	CatalogApp,
} from "../../../types/appCatalog"

type Tab = "apps" | "articulos" | "resenas"

const emptyAppForm = {
	slug: "",
	name: "",
	tagline: "",
	description: "",
	iconUrl: "",
	platforms: "Android",
	priceLabel: "",
	downloadUrl: "",
	releaseKey: "",
	isPublished: false,
}

const emptyArticleForm = {
	categoryId: "",
	slug: "",
	title: "",
	body: "",
	isPublished: false,
}

export default function CatalogPage() {
	const catalog = useAppCatalog()
	const [tab, setTab] = useState<Tab>("apps")

	// App form
	const [appDialogOpen, setAppDialogOpen] = useState(false)
	const [editingAppId, setEditingAppId] = useState<string | null>(null)
	const [appForm, setAppForm] = useState(emptyAppForm)
	const [uploadingIcon, setUploadingIcon] = useState(false)
	const [savingApp, setSavingApp] = useState(false)

	// Artículos
	const [articlesAppId, setArticlesAppId] = useState("")
	const [categories, setCategories] = useState<AppCategory[]>([])
	const [articles, setArticlesAppArticles] = useState<AppArticle[]>([])
	const [articleDialogOpen, setArticleDialogOpen] = useState(false)
	const [editingArticleId, setEditingArticleId] = useState<string | null>(null)
	const [articleForm, setArticleForm] = useState(emptyArticleForm)
	const [savingArticle, setSavingArticle] = useState(false)

	// Reseñas
	const [reviewsAppSlug, setReviewsAppSlug] = useState("")
	const [reviews, setReviews] = useState<AppReview[]>([])
	const [loadingReviews, setLoadingReviews] = useState(false)

	const selectedArticlesApp = useMemo(
		() => catalog.apps.find((a) => a.id === articlesAppId) ?? null,
		[catalog.apps, articlesAppId],
	)

	useEffect(() => {
		if (!articlesAppId && catalog.apps.length > 0) {
			setArticlesAppId(catalog.apps[0].id)
		}
	}, [catalog.apps, articlesAppId])

	useEffect(() => {
		if (!reviewsAppSlug && catalog.apps.length > 0) {
			setReviewsAppSlug(catalog.apps[0].slug)
		}
	}, [catalog.apps, reviewsAppSlug])

	const refreshArticlesTab = async () => {
		if (!selectedArticlesApp) return
		const cats = await catalog.fetchCategories(selectedArticlesApp.id).catch(() => [])
		setCategories(cats)
		// Los artículos se leen por el endpoint público (sin auth requerida extra)
		try {
			const base = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"
			const token = localStorage.getItem("token")
			const res = await fetch(
				`${base}/api/apps/${selectedArticlesApp.slug}/articles`,
				{ headers: token ? { Authorization: `Bearer ${token}` } : {} },
			)
			if (res.ok) {
				const data = (await res.json()) as { articles: AppArticle[] }
				setArticlesAppArticles(data.articles)
			} else {
				setArticlesAppArticles([])
			}
		} catch {
			setArticlesAppArticles([])
		}
	}

	useEffect(() => {
		if (tab === "articulos" && selectedArticlesApp) {
			void refreshArticlesTab()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab, selectedArticlesApp?.id])

	const refreshReviewsTab = async (slug: string) => {
		if (!slug) return
		setLoadingReviews(true)
		try {
			setReviews(await catalog.fetchReviews(slug))
		} catch {
			setReviews([])
		} finally {
			setLoadingReviews(false)
		}
	}

	useEffect(() => {
		if (tab === "resenas" && reviewsAppSlug) {
			void refreshReviewsTab(reviewsAppSlug)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab, reviewsAppSlug])

	const openNewApp = () => {
		setEditingAppId(null)
		setAppForm(emptyAppForm)
		setAppDialogOpen(true)
	}

	const openEditApp = (app: CatalogApp) => {
		setEditingAppId(app.id)
		setAppForm({
			slug: app.slug,
			name: app.name,
			tagline: app.tagline,
			description: app.description,
			iconUrl: app.icon_url,
			platforms: app.platforms.join(", "),
			priceLabel: app.price_label,
			downloadUrl: app.download_url,
			releaseKey: app.release_key ?? "",
			isPublished: app.is_published,
		})
		setAppDialogOpen(true)
	}

	const handleUploadIcon = async (file: File | undefined) => {
		if (!file) return
		setUploadingIcon(true)
		try {
			const url = await catalog.uploadIcon(file)
			setAppForm((f) => ({ ...f, iconUrl: url }))
		} catch (e: unknown) {
			window.alert(e instanceof Error ? e.message : "No se pudo subir el icono")
		} finally {
			setUploadingIcon(false)
		}
	}

	const handleSaveApp = async () => {
		if (!appForm.name.trim()) {
			window.alert("El nombre es obligatorio")
			return
		}
		setSavingApp(true)
		try {
			await catalog.saveApp(editingAppId, {
				slug: appForm.slug.trim() || undefined,
				name: appForm.name.trim(),
				tagline: appForm.tagline,
				description: appForm.description,
				iconUrl: appForm.iconUrl,
				platforms: appForm.platforms.split(",").map((p) => p.trim()).filter(Boolean),
				priceLabel: appForm.priceLabel,
				downloadUrl: appForm.downloadUrl,
				releaseKey: appForm.releaseKey.trim() || null,
				isPublished: appForm.isPublished,
			})
			setAppDialogOpen(false)
		} catch (e: unknown) {
			window.alert(e instanceof Error ? e.message : "No se pudo guardar")
		} finally {
			setSavingApp(false)
		}
	}

	const handleDeleteApp = async (app: CatalogApp) => {
		if (!window.confirm(`¿Borrar "${app.name}" con sus artículos y reseñas?`)) return
		await catalog.removeApp(app.id)
	}

	const openNewArticle = () => {
		setEditingArticleId(null)
		setArticleForm(emptyArticleForm)
		setArticleDialogOpen(true)
	}

	const openEditArticle = (article: AppArticle) => {
		setEditingArticleId(article.id)
		setArticleForm({
			categoryId: article.category_id ?? "",
			slug: article.slug,
			title: article.title,
			body: article.body,
			isPublished: article.is_published,
		})
		setArticleDialogOpen(true)
	}

	const handleSaveArticle = async () => {
		if (!selectedArticlesApp || !articleForm.title.trim()) {
			window.alert("El título es obligatorio")
			return
		}
		setSavingArticle(true)
		try {
			await catalog.saveArticle(selectedArticlesApp.id, editingArticleId, {
				categoryId: articleForm.categoryId || null,
				slug: articleForm.slug.trim() || undefined,
				title: articleForm.title.trim(),
				body: articleForm.body,
				isPublished: articleForm.isPublished,
			})
			setArticleDialogOpen(false)
			await refreshArticlesTab()
		} catch (e: unknown) {
			window.alert(e instanceof Error ? e.message : "No se pudo guardar")
		} finally {
			setSavingArticle(false)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">Catálogo de apps</h1>
				<p className="text-muted-foreground">
					Publica aplicaciones, sus artículos y modera reseñas. Lo publicado alimenta la web al instante.
				</p>
			</div>

			<div className="flex gap-2">
				{(["apps", "articulos", "resenas"] as Tab[]).map((t) => (
					<Button
						key={t}
						variant={tab === t ? "default" : "outline"}
						onClick={() => setTab(t)}
					>
						{t === "apps" ? "Apps" : t === "articulos" ? "Artículos" : "Reseñas"}
					</Button>
				))}
			</div>

			{tab === "apps" && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Aplicaciones</CardTitle>
								<CardDescription>Cada app tiene su página con su enlace, versión y artículos.</CardDescription>
							</div>
							<Button onClick={openNewApp}>
								<Plus className="mr-2 h-4 w-4" /> Nueva app
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{catalog.loading ? (
							<p className="text-sm text-muted-foreground">Cargando...</p>
						) : catalog.apps.length === 0 ? (
							<p className="text-sm text-muted-foreground">Nada publicado todavía.</p>
						) : (
							catalog.apps.map((app) => (
								<div key={app.id} className="rounded-xl border p-4">
									<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
										<div className="flex items-center gap-3">
											{app.icon_url ? (
												<img src={app.icon_url} alt={app.name} className="h-12 w-12 rounded-xl object-cover" />
											) : (
												<div className="h-12 w-12 rounded-xl bg-muted" />
											)}
											<div>
												<div className="flex items-center gap-2">
													<p className="font-semibold">{app.name}</p>
													<Badge variant={app.is_published ? "default" : "secondary"}>
														{app.is_published ? "Publicada" : "Oculta"}
													</Badge>
												</div>
												<p className="text-sm text-muted-foreground">
													/{app.slug} · {app.platforms.join(", ") || "sin plataforma"} · ★ {Number(app.rating_avg).toFixed(1)} ({app.rating_count})
												</p>
												<p className="text-sm text-muted-foreground">
													{app.release_version_name
														? `v${app.release_version_name} (código ${app.release_version_code})`
														: "Sin versión enlazada"}
												</p>
											</div>
										</div>
										<div className="flex gap-2">
											<Button variant="outline" size="sm" onClick={() => openEditApp(app)}>
												<Pencil className="mr-2 h-4 w-4" /> Editar
											</Button>
											<Button variant="destructive" size="sm" onClick={() => void handleDeleteApp(app)}>
												<Trash2 className="mr-2 h-4 w-4" /> Borrar
											</Button>
										</div>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			)}

			{tab === "articulos" && (
				<>
					<Card>
						<CardHeader>
							<CardTitle>App</CardTitle>
						</CardHeader>
						<CardContent>
							<Select value={articlesAppId} onValueChange={setArticlesAppId}>
								<SelectTrigger><SelectValue placeholder="Elige app" /></SelectTrigger>
								<SelectContent>
									{catalog.apps.map((a) => (
										<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Categorías de {selectedArticlesApp?.name ?? "..."}</CardTitle>
							<CardDescription>Se crean de forma dinámica por app.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex flex-wrap gap-2">
								{categories.map((c) => (
									<Badge key={c.id} variant="outline" className="gap-2 py-1">
										{c.name}
										<button
											type="button"
											className="text-destructive"
											onClick={() => void catalog.removeCategory(c.id).then(() => void refreshArticlesTab())}
										>
											×
										</button>
									</Badge>
								))}
								{categories.length === 0 && (
									<p className="text-sm text-muted-foreground">Sin categorías.</p>
								)}
							</div>
							<NewCategoryForm
								onCreate={async (name) => {
									if (!selectedArticlesApp) return
									await catalog.createCategory(selectedArticlesApp.id, name)
									await refreshArticlesTab()
								}}
							/>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Artículos</CardTitle>
								<Button onClick={openNewArticle} disabled={!selectedArticlesApp}>
									<Plus className="mr-2 h-4 w-4" /> Nuevo artículo
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{articles.length === 0 ? (
								<p className="text-sm text-muted-foreground">Sin artículos.</p>
							) : (
								articles.map((a) => (
									<div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
										<div>
											<p className="font-medium">{a.title}</p>
											<p className="text-sm text-muted-foreground">
												/{a.slug} · {a.category_name ?? "sin categoría"} · {a.is_published ? "Publicado" : "Borrador"}
											</p>
										</div>
										<div className="flex gap-2">
											<Button variant="outline" size="sm" onClick={() => openEditArticle(a)}>
												<Pencil className="mr-2 h-4 w-4" /> Editar
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => void catalog.removeArticle(a.id).then(() => void refreshArticlesTab())}
											>
												<Trash2 className="mr-2 h-4 w-4" />
											</Button>
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</>
			)}

			{tab === "resenas" && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-4">
							<CardTitle>Reseñas</CardTitle>
							<Select value={reviewsAppSlug} onValueChange={(v) => { setReviewsAppSlug(v); void refreshReviewsTab(v) }}>
								<SelectTrigger className="w-64"><SelectValue placeholder="Elige app" /></SelectTrigger>
								<SelectContent>
									{catalog.apps.map((a) => (
										<SelectItem key={a.id} value={a.slug}>{a.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardHeader>
					<CardContent className="space-y-3">
						{loadingReviews ? (
							<p className="text-sm text-muted-foreground">Cargando...</p>
						) : reviews.length === 0 ? (
							<p className="text-sm text-muted-foreground">Sin reseñas.</p>
						) : (
							reviews.map((r) => (
								<div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
									<div>
										<p className="font-medium">
											{r.user_name} · {r.rating} <Star className="inline h-4 w-4" />
										</p>
										<p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.comment || "Sin comentario"}</p>
									</div>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => void catalog.removeReview(r.id).then(() => void refreshReviewsTab(reviewsAppSlug))}
									>
										<Trash2 className="mr-2 h-4 w-4" />
									</Button>
								</div>
							))
						)}
					</CardContent>
				</Card>
			)}

			<Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingAppId ? "Editar app" : "Nueva app"}</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Nombre *</Label>
							<Input value={appForm.name} onChange={(e) => setAppForm({ ...appForm, name: e.target.value })} />
						</div>
						<div className="space-y-2">
							<Label>Slug (vacío = desde el nombre)</Label>
							<Input value={appForm.slug} onChange={(e) => setAppForm({ ...appForm, slug: e.target.value })} placeholder="gestor-contable-tcp" />
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>Subtítulo</Label>
							<Input value={appForm.tagline} onChange={(e) => setAppForm({ ...appForm, tagline: e.target.value })} />
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>Descripción</Label>
							<Textarea value={appForm.description} onChange={(e) => setAppForm({ ...appForm, description: e.target.value })} rows={4} />
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>Icono (Supabase Storage)</Label>
							<div className="flex items-center gap-3">
								{appForm.iconUrl && (
									<img src={appForm.iconUrl} alt="icono" className="h-12 w-12 rounded-xl object-cover" />
								)}
								<Input
									type="file"
									accept="image/*"
									disabled={uploadingIcon}
									onChange={(e) => void handleUploadIcon(e.target.files?.[0])}
								/>
							</div>
							<Input
								value={appForm.iconUrl}
								onChange={(e) => setAppForm({ ...appForm, iconUrl: e.target.value })}
								placeholder="...o pega la URL directa"
							/>
						</div>
						<div className="space-y-2">
							<Label>Plataformas (coma)</Label>
							<Input value={appForm.platforms} onChange={(e) => setAppForm({ ...appForm, platforms: e.target.value })} placeholder="Android, Windows" />
						</div>
						<div className="space-y-2">
							<Label>Etiqueta de precio</Label>
							<Input value={appForm.priceLabel} onChange={(e) => setAppForm({ ...appForm, priceLabel: e.target.value })} placeholder="Pro / Gratis" />
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>Enlace de descarga</Label>
							<Input value={appForm.downloadUrl} onChange={(e) => setAppForm({ ...appForm, downloadUrl: e.target.value })} />
						</div>
						<div className="space-y-2">
							<Label>Clave de versión (app-releases)</Label>
							<Input value={appForm.releaseKey} onChange={(e) => setAppForm({ ...appForm, releaseKey: e.target.value })} placeholder="gctcp-android" />
						</div>
						<div className="flex items-end gap-2 pb-2">
							<input
								type="checkbox"
								id="app-published"
								checked={appForm.isPublished}
								onChange={(e) => setAppForm({ ...appForm, isPublished: e.target.checked })}
							/>
							<Label htmlFor="app-published">Publicada en la web</Label>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => void handleSaveApp()} disabled={savingApp}>
							<Upload className="mr-2 h-4 w-4" />
							{savingApp ? "Guardando..." : "Guardar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingArticleId ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="space-y-2">
							<Label>Título *</Label>
							<Input value={articleForm.title} onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })} />
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Slug (vacío = desde el título)</Label>
								<Input value={articleForm.slug} onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })} />
							</div>
							<div className="space-y-2">
								<Label>Categoría</Label>
								<Select value={articleForm.categoryId || "__none"} onValueChange={(v) => setArticleForm({ ...articleForm, categoryId: v === "__none" ? "" : v })}>
									<SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="__none">Sin categoría</SelectItem>
										{categories.map((c) => (
											<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Contenido (Markdown)</Label>
							<Textarea value={articleForm.body} onChange={(e) => setArticleForm({ ...articleForm, body: e.target.value })} rows={8} />
						</div>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="article-published"
								checked={articleForm.isPublished}
								onChange={(e) => setArticleForm({ ...articleForm, isPublished: e.target.checked })}
							/>
							<Label htmlFor="article-published">Publicado</Label>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => void handleSaveArticle()} disabled={savingArticle}>
							{savingArticle ? "Guardando..." : "Guardar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

function NewCategoryForm({ onCreate }: { onCreate: (name: string) => Promise<void> }) {
	const [name, setName] = useState("")
	const [saving, setSaving] = useState(false)
	return (
		<div className="flex gap-2">
			<Input
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Nueva categoría (p. ej. Novedades)"
			/>
			<Button
				disabled={saving || !name.trim()}
				onClick={() => {
					setSaving(true)
					onCreate(name.trim()).finally(() => {
						setSaving(false)
						setName("")
					})
				}}
			>
				<Plus className="mr-2 h-4 w-4" /> Crear
			</Button>
		</div>
	)
}
